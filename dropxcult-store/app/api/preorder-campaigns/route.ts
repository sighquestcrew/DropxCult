import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

// Get user from token
const getUser = (req: Request) => {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    const token = authHeader.split(" ")[1];
    try {
        return jwt.verify(token, process.env.NEXTAUTH_SECRET!) as { _id: string; name: string; email: string };
    } catch {
        return null;
    }
};

// Generate order number
function generateOrderNumber(): string {
    const prefix = "DXC-PO";
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}-${timestamp}${random}`;
}

// GET: Fetch active campaign for a product
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const productId = searchParams.get("productId");

        if (!productId) {
            return NextResponse.json({ error: "Product ID required" }, { status: 400 });
        }

        const now = new Date();

        // Find active campaign for this product
        const campaign = await prisma.preOrderCampaign.findFirst({
            where: {
                productId,
                status: "active",
                startDate: { lte: now },
                endDate: { gte: now }
            },
            select: {
                id: true,
                name: true,
                startDate: true,
                endDate: true,
                minQuantity: true,
                maxQuantity: true,
                deliveryDays: true,
                totalQuantity: true,
                totalOrders: true
            }
        });

        if (!campaign) {
            return NextResponse.json({ campaign: null });
        }

        // Calculate expected delivery date
        const deliveryDate = new Date(campaign.endDate);
        deliveryDate.setDate(deliveryDate.getDate() + campaign.deliveryDays);

        return NextResponse.json({
            campaign: {
                ...campaign,
                progress: Math.min(100, Math.round((campaign.totalQuantity / campaign.minQuantity) * 100)),
                expectedDelivery: deliveryDate.toISOString(),
                daysRemaining: Math.max(0, Math.ceil((new Date(campaign.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
            }
        });

    } catch (error: any) {
        console.error("Campaign Fetch Error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

// POST: Place pre-order
export async function POST(req: Request) {
    try {
        const user = getUser(req);
        if (!user) {
            return NextResponse.json({ error: "Please login to pre-order" }, { status: 401 });
        }

        const body = await req.json();
        const {
            campaignId,
            items, // [{productId, size, quantity}]
            shippingAddress,
            phone,
            notifyEmail = true,
            notifyWhatsapp = false,
            paymentId // Razorpay payment ID
        } = body;

        if (!campaignId || !items || !shippingAddress) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Validate campaign
        const campaign = await prisma.preOrderCampaign.findUnique({
            where: { id: campaignId },
            include: { product: true }
        });

        if (!campaign) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        }

        if (campaign.status !== "active") {
            return NextResponse.json({ error: "This campaign is not active" }, { status: 400 });
        }

        const now = new Date();
        if (now < new Date(campaign.startDate) || now > new Date(campaign.endDate)) {
            return NextResponse.json({ error: "Pre-order window is not open" }, { status: 400 });
        }

        // Check max quantity if set
        if (campaign.maxQuantity) {
            const totalQty = items.reduce((sum: number, i: any) => sum + i.quantity, 0);
            if (campaign.totalQuantity + totalQty > campaign.maxQuantity) {
                return NextResponse.json({ error: "Campaign has reached maximum orders" }, { status: 400 });
            }
        }

        // Calculate totals
        const itemsWithPrice = items.map((item: any) => ({
            ...item,
            price: campaign.product.price
        }));

        const subtotal = itemsWithPrice.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0);
        const totalAmount = subtotal; // Can add discount logic here

        // Create pre-order entry
        const orderNumber = generateOrderNumber();
        const totalQty = items.reduce((sum: number, i: any) => sum + i.quantity, 0);

        const preOrder = await prisma.$transaction(async (tx) => {
            // Create the pre-order
            const order = await tx.preOrderEntry.create({
                data: {
                    orderNumber,
                    campaignId,
                    userId: user._id,
                    subtotal,
                    totalAmount,
                    shippingAddress,
                    paymentId: paymentId || null,
                    paymentStatus: paymentId ? "paid" : "pending",
                    paidAt: paymentId ? new Date() : null,
                    notifyEmail,
                    notifyWhatsapp,
                    phone: phone || null,
                    status: "pending",
                    statusHistory: JSON.stringify([
                        { status: "pending", timestamp: new Date().toISOString(), note: "Pre-order placed" }
                    ]),
                    items: {
                        create: itemsWithPrice.map((item: any) => ({
                            productId: campaign.productId,
                            size: item.size,
                            quantity: item.quantity,
                            price: item.price
                        }))
                    }
                },
                include: { items: true }
            });

            // Update campaign stats
            await tx.preOrderCampaign.update({
                where: { id: campaignId },
                data: {
                    totalOrders: { increment: 1 },
                    totalQuantity: { increment: totalQty },
                    totalRevenue: { increment: totalAmount }
                }
            });

            return order;
        });

        return NextResponse.json({
            success: true,
            orderNumber: preOrder.orderNumber,
            preOrder: {
                id: preOrder.id,
                orderNumber: preOrder.orderNumber,
                totalAmount: preOrder.totalAmount,
                status: preOrder.status,
                items: preOrder.items
            }
        });

    } catch (error: any) {
        console.error("Pre-Order Create Error:", error);
        return NextResponse.json({ error: "Failed to place pre-order" }, { status: 500 });
    }
}
