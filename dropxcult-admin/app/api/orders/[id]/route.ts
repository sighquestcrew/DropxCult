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

