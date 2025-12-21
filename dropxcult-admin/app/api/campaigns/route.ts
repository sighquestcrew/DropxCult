import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret";

// Verify admin token
const getAdmin = (req: Request) => {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    const token = authHeader.split(" ")[1];
    try {
        const user = jwt.verify(token, JWT_SECRET) as { id: string; isAdmin: boolean };
        return user.isAdmin ? user : null;
    } catch {
        return null;
    }
};

// GET: List all campaigns with stats
export async function GET(req: Request) {
    try {
        const admin = getAdmin(req);
        if (!admin) {
            return NextResponse.json({ error: "Admin only" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");
        const campaignId = searchParams.get("id");

        // Single campaign with full details
        if (campaignId) {
            const campaign = await prisma.preOrderCampaign.findUnique({
                where: { id: campaignId },
                include: {
                    product: { select: { id: true, name: true, slug: true, images: true, price: true } },
                    preOrders: {
                        include: {
                            items: true,
                            user: { select: { name: true, email: true } }
                        },
                        orderBy: { createdAt: "desc" }
                    }
                }
            });

            if (!campaign) {
                return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
            }

            // Calculate size breakdown
            const sizeBreakdown: Record<string, number> = {};
            for (const order of campaign.preOrders) {
                for (const item of order.items) {
                    sizeBreakdown[item.size] = (sizeBreakdown[item.size] || 0) + item.quantity;
                }
            }

            return NextResponse.json({
                ...campaign,
                sizeBreakdown,
                progress: Math.min(100, Math.round((campaign.totalQuantity / campaign.minQuantity) * 100))
            });
        }

        // List all campaigns
        const campaigns = await prisma.preOrderCampaign.findMany({
            where: status ? { status } : undefined,
            include: {
                product: { select: { id: true, name: true, slug: true, images: true } }
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(campaigns);

    } catch (error: any) {
        console.error("Campaigns GET Error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

// POST: Create new campaign
export async function POST(req: Request) {
    try {
        const admin = getAdmin(req);
        if (!admin) {
            return NextResponse.json({ error: "Admin only" }, { status: 403 });
        }

        const body = await req.json();
        const {
            productId,
            name,
            description,
            startDate,
            endDate,
            minQuantity,
            maxQuantity,
            deliveryDays
        } = body;

        if (!productId || !name || !startDate || !endDate) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (end <= start) {
            return NextResponse.json({ error: "End date must be after start date" }, { status: 400 });
        }

        // Check if product exists
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        // Check for existing active campaign for this product
        const existingCampaign = await prisma.preOrderCampaign.findFirst({
            where: {
                productId,
                status: { in: ["draft", "active"] }
            }
        });

        if (existingCampaign) {
            return NextResponse.json({
                error: "This product already has an active/draft campaign"
            }, { status: 400 });
        }

        const campaign = await prisma.preOrderCampaign.create({
            data: {
                productId,
                name,
                description: description || null,
                startDate: start,
                endDate: end,
                minQuantity: minQuantity || 50,
                maxQuantity: maxQuantity || null,
                deliveryDays: deliveryDays || 25,
                status: "draft"
            },
            include: {
                product: { select: { name: true, slug: true } }
            }
        });

        return NextResponse.json({ success: true, campaign });

    } catch (error: any) {
        console.error("Campaign Create Error:", error);
        return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
    }
}

// PATCH: Update campaign status or details
export async function PATCH(req: Request) {
    try {
        const admin = getAdmin(req);
        if (!admin) {
            return NextResponse.json({ error: "Admin only" }, { status: 403 });
        }

        const body = await req.json();
        const { id, action, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: "Campaign ID required" }, { status: 400 });
        }

        const campaign = await prisma.preOrderCampaign.findUnique({
            where: { id },
            include: { preOrders: true }
        });

        if (!campaign) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        }

        // Handle specific actions
        if (action === "activate") {
            if (campaign.status !== "draft") {
                return NextResponse.json({ error: "Only draft campaigns can be activated" }, { status: 400 });
            }

            await prisma.preOrderCampaign.update({
                where: { id },
                data: { status: "active" }
            });

            return NextResponse.json({ success: true, message: "Campaign activated" });
        }

        if (action === "close") {
            if (campaign.status !== "active") {
                return NextResponse.json({ error: "Only active campaigns can be closed" }, { status: 400 });
            }

            // Check if min quantity met
            const minMet = campaign.totalQuantity >= campaign.minQuantity;

            if (minMet) {
                // Update campaign status and all orders to confirmed
                await prisma.$transaction([
                    prisma.preOrderCampaign.update({
                        where: { id },
                        data: { status: "closed" }
                    }),
                    prisma.preOrderEntry.updateMany({
                        where: { campaignId: id, status: "pending" },
                        data: { status: "confirmed" }
                    })
                ]);

                return NextResponse.json({
                    success: true,
                    message: `Campaign closed! ${campaign.totalQuantity} orders confirmed for production.`,
                    minMet: true
                });
            } else {
                // Refund all orders (this would trigger actual Razorpay refunds in production)
                await prisma.$transaction([
                    prisma.preOrderCampaign.update({
                        where: { id },
                        data: { status: "cancelled" }
                    }),
                    prisma.preOrderEntry.updateMany({
                        where: { campaignId: id, status: "pending" },
                        data: {
                            status: "refunded",
                            refundReason: "Minimum order quantity not met"
                        }
                    })
                ]);

                return NextResponse.json({
                    success: true,
                    message: `Campaign cancelled. ${campaign.preOrders.length} orders marked for refund.`,
                    minMet: false
                });
            }
        }

        if (action === "start_production") {
            if (campaign.status !== "closed") {
                return NextResponse.json({ error: "Only closed campaigns can start production" }, { status: 400 });
            }

            await prisma.$transaction([
                prisma.preOrderCampaign.update({
                    where: { id },
                    data: { status: "fulfilled" }
                }),
                prisma.preOrderEntry.updateMany({
                    where: { campaignId: id, status: "confirmed" },
                    data: { status: "in_production" }
                })
            ]);

            return NextResponse.json({ success: true, message: "Production started!" });
        }

        // General updates (name, dates, quantities, etc.)
        const allowedFields = ["name", "description", "startDate", "endDate", "minQuantity", "maxQuantity", "deliveryDays"];
        const updateData: any = {};

        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                if (field === "startDate" || field === "endDate") {
                    updateData[field] = new Date(updates[field]);
                } else {
                    updateData[field] = updates[field];
                }
            }
        }

        if (Object.keys(updateData).length > 0) {
            const updated = await prisma.preOrderCampaign.update({
                where: { id },
                data: updateData
            });
            return NextResponse.json({ success: true, campaign: updated });
        }

        return NextResponse.json({ error: "No valid updates provided" }, { status: 400 });

    } catch (error: any) {
        console.error("Campaign Update Error:", error);
        return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 });
    }
}

// DELETE: Delete draft campaign
export async function DELETE(req: Request) {
    try {
        const admin = getAdmin(req);
        if (!admin) {
            return NextResponse.json({ error: "Admin only" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Campaign ID required" }, { status: 400 });
        }

        const campaign = await prisma.preOrderCampaign.findUnique({ where: { id } });

        if (!campaign) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        }

        if (campaign.status !== "draft") {
            return NextResponse.json({ error: "Only draft campaigns can be deleted" }, { status: 400 });
        }

        await prisma.preOrderCampaign.delete({ where: { id } });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Campaign Delete Error:", error);
        return NextResponse.json({ error: "Failed to delete campaign" }, { status: 500 });
    }
}
