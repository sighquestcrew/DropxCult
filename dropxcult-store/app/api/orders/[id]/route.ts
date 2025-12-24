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
            // Check pre-orders if regular order not found
            const preOrder = await prisma.preOrderEntry.findFirst({
                where: {
                    OR: [
                        { id },
                        { orderNumber: id },
                        { id: { startsWith: id.toLowerCase() } },
                        { orderNumber: { startsWith: id.toUpperCase() } }
                    ]
                },
                include: {
                    items: {
                        include: {
                            product: {
                                select: { name: true, images: true }
                            }
                        }
                    },
                    user: {
                        select: { name: true, email: true }
                    },
                    campaign: {
                        select: { name: true, deliveryDays: true }
                    }
                }
            });

            if (preOrder) {
                // Transform pre-order to match order structure
                return NextResponse.json({
                    id: preOrder.id,
                    status: preOrder.status.charAt(0).toUpperCase() + preOrder.status.slice(1),
                    isPaid: preOrder.paymentStatus === 'paid',
                    isDelivered: preOrder.status === 'delivered',
                    totalPrice: preOrder.totalAmount,
                    itemsPrice: preOrder.subtotal,
                    shippingAddress: preOrder.shippingAddress,
                    orderItems: preOrder.items.map(item => ({
                        name: item.product?.name || 'Product',
                        qty: item.quantity,
                        price: item.price,
                        size: item.size,
                        image: item.product?.images?.[0] || ''
                    })),
                    trackingId: preOrder.trackingNumber || null,
                    trackingUrl: null,
                    createdAt: preOrder.createdAt,
                    paidAt: preOrder.paidAt,
                    deliveredAt: preOrder.deliveredAt,
                    isPreOrder: true,
                    campaign: preOrder.campaign
                });
            }

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
