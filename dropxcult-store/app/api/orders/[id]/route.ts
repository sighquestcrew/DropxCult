import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET: Fetch order by ID for tracking
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: "Order ID required" }, { status: 400 });
        }

        // Try to find by full ID or partial ID (case insensitive)
        let order = await prisma.order.findUnique({
            where: { id },
            include: {
                orderItems: true,
                user: {
                    select: { name: true, email: true }
                }
            }
        });

        // If not found, try searching by partial ID
        if (!order) {
            const orders = await prisma.order.findMany({
                where: {
                    id: {
                        startsWith: id.toLowerCase()
                    }
                },
                include: {
                    orderItems: true,
                    user: {
                        select: { name: true, email: true }
                    }
                },
                take: 1
            });
            order = orders[0] || null;
        }

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // Return order with tracking info
        const orderData = order as any; // Type assertion for optional fields
        return NextResponse.json({
            id: order.id,
            status: order.status || "Placed",
            isPaid: order.isPaid,
            isDelivered: order.isDelivered,
            totalPrice: order.totalPrice,
            itemsPrice: order.itemsPrice,
            shippingAddress: order.shippingAddress,
            orderItems: order.orderItems,
            trackingId: orderData.trackingId || null,
            trackingUrl: orderData.trackingUrl || null,
            createdAt: order.createdAt,
            paidAt: order.paidAt,
            deliveredAt: order.deliveredAt,
        });
    } catch (error: any) {
        console.error("Order Fetch Error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
