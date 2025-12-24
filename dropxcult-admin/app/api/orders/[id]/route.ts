import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

// GET single order
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                user: { select: { name: true, email: true } },
                orderItems: true
            }
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        return NextResponse.json(order);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
    }
}

// PATCH - Update order status
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const body = await req.json();
        const { status, isPaid, isDelivered } = body;

        const updateData: any = {};

        if (status !== undefined) {
            updateData.status = status;
        }

        if (isPaid !== undefined) {
            updateData.isPaid = isPaid;
            if (isPaid) {
                updateData.paidAt = new Date();
            }
        }

        if (isDelivered !== undefined) {
            updateData.isDelivered = isDelivered;
            if (isDelivered) {
                updateData.deliveredAt = new Date();
                updateData.status = "Delivered";
            }
        }

        const order = await prisma.order.update({
            where: { id },
            data: updateData
        });

        // Audit log: Order status change
        await logAudit({
            userRole: "admin",
            action: "STATUS_CHANGE",
            entity: "Order",
            entityId: id,
            details: {
                status: updateData.status,
                isPaid: updateData.isPaid,
                isDelivered: updateData.isDelivered
            },
        });

        return NextResponse.json(order);
    } catch (error) {
        console.error("Order update error:", error);
        return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
    }
}

// DELETE - Delete order
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        // Delete order items first (if cascade not set, though highly recommended to have cascade in schema)
        // We will try deleting the order directly. If it fails due to foreign key, we might need to delete items first.
        // Assuming schema handles cascade or we manually delete items.
        // Let's manually delete items to be safe if cascade isn't perfect.
        await prisma.orderItem.deleteMany({
            where: { orderId: id }
        });

        const order = await prisma.order.delete({
            where: { id }
        });

        // Audit log: Order deleted
        await logAudit({
            userRole: "admin",
            action: "DELETE",
            entity: "Order",
            entityId: id,
            details: {
                previousStatus: order.status
            },
        });

        return NextResponse.json({ message: "Order deleted successfully" });
    } catch (error) {
        console.error("Order delete error:", error);
        return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
    }
}
