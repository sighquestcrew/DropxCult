import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * One-time data migration to sync order status with isDelivered flag
 * This fixes orders where status="Delivered" but isDelivered=false
 */
export async function POST() {
    try {
        // Find all orders where status is "Delivered" but isDelivered is false
        const ordersToFix = await prisma.order.findMany({
            where: {
                status: "Delivered",
                isDelivered: false,
            },
        });

        console.log(`Found ${ordersToFix.length} orders to fix`);

        // Update them to set isDelivered = true
        const updatePromises = ordersToFix.map((order) =>
            prisma.order.update({
                where: { id: order.id },
                data: {
                    isDelivered: true,
                    deliveredAt: order.deliveredAt || new Date(), // Set to now if not already set
                },
            })
        );

        await Promise.all(updatePromises);

        return NextResponse.json({
            success: true,
            message: `Successfully synced ${ordersToFix.length} orders`,
            updatedCount: ordersToFix.length,
        });
    } catch (error) {
        console.error("Migration error:", error);
        return NextResponse.json(
            { error: "Failed to migrate data" },
            { status: 500 }
        );
    }
}
