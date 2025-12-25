import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

// Helper to extract user ID from Authorization header
const getUserId = (req: NextRequest): string | null => {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as { _id: string };
        return decoded._id;
    } catch (error) {
        return null;
    }
};

export async function GET(req: NextRequest) {
    try {
        const userId = getUserId(req);

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Get user's design IDs from both tables
        const customDesigns = await prisma.customRequest.findMany({
            where: { userId },
            select: { id: true, type: true } // CustomRequest doesn't have 'name', use 'type' instead
        });

        const design3D = await prisma.design.findMany({
            where: { userId },
            select: { id: true, name: true }
        });

        // Create a map of designId => designName
        const designMap: Record<string, string> = {};
        customDesigns.forEach(d => designMap[d.id] = `${d.type} Design` || 'Custom Design');
        design3D.forEach(d => designMap[d.id] = d.name || 'Unnamed 3D Design');

        const allDesignIds = Object.keys(designMap);

        if (allDesignIds.length === 0) {
            return NextResponse.json({ transactions: [] });
        }

        // 2. Find order items with those design IDs (only from paid orders)
        const sales = await prisma.orderItem.findMany({
            where: {
                designId: { in: allDesignIds },
                order: { isPaid: true } // Only paid orders count
            },
            include: {
                order: {
                    select: {
                        id: true,
                        paidAt: true,
                        userId: true,
                        user: { select: { name: true } }
                    }
                }
            },
            orderBy: { id: 'desc' }, // OrderItem doesn't have createdAt, use id instead
            take: 100 // Last 100 transactions
        });

        // 3. Format response with royalty calculation
        const transactions = [];

        for (const item of sales) {
            if (!item.designId) continue;

            // Find the designer to check for self-purchase
            let designerUserId: string | null = null;
            const customRequest = await prisma.customRequest.findUnique({
                where: { id: item.designId },
                select: { userId: true }
            });

            if (customRequest) {
                designerUserId = customRequest.userId;
            } else {
                const design3D = await prisma.design.findUnique({
                    where: { id: item.designId },
                    select: { userId: true }
                });
                if (design3D) {
                    designerUserId = design3D.userId;
                }
            }

            // Skip self-purchases (no royalty earned)
            if (item.order.userId && item.order.userId === designerUserId) {
                continue;
            }

            const salePrice = item.price * item.qty;
            const royaltyEarned = Math.round(salePrice * 0.10);

            transactions.push({
                id: item.id,
                orderId: item.order.id,
                designName: designMap[item.designId] || 'Unknown Design',
                designId: item.designId,
                salePrice,
                royaltyEarned,
                quantity: item.qty,
                soldAt: item.order.paidAt,
                buyerName: item.order.user?.name || 'Guest Customer'
            });
        }

        // 4. Calculate summary stats
        const totalEarnings = transactions.reduce((sum, tx) => sum + tx.royaltyEarned, 0);
        const totalSales = transactions.length;

        return NextResponse.json({
            transactions,
            summary: {
                totalEarnings,
                totalSales
            }
        });

    } catch (error: any) {
        console.error("Royalty history error:", error);
        return NextResponse.json(
            { error: "Failed to fetch royalty history" },
            { status: 500 }
        );
    }
}
