import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * One-time migration to retroactively credit royalties for all past sales
 * This fixes designers who had sales before the royalty system was implemented
 */
export async function POST() {
    try {
        console.log("Starting retroactive royalty migration...");

        // 1. Find all paid order items with designId
        const paidOrderItems = await prisma.orderItem.findMany({
            where: {
                designId: { not: null },
                order: { isPaid: true }
            },
            include: {
                order: {
                    select: {
                        id: true,
                        userId: true, // Buyer
                        paidAt: true
                    }
                }
            }
        });

        console.log(`Found ${paidOrderItems.length} paid order items with designs`);

        // 2. Group by designer and calculate royalties
        const royaltyByDesigner: Record<string, { amount: number; sales: number; designs: Set<string> }> = {};

        for (const item of paidOrderItems) {
            if (!item.designId) continue;

            // Look up designer from CustomRequest or Design
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

            if (!designerUserId) continue;

            // Skip if buyer is the designer (no self-royalty)
            if (item.order.userId && item.order.userId === designerUserId) {
                continue;
            }

            // Calculate 10% royalty
            const royaltyAmount = Math.round((item.price * item.qty) * 0.10);

            if (!royaltyByDesigner[designerUserId]) {
                royaltyByDesigner[designerUserId] = { amount: 0, sales: 0, designs: new Set() };
            }

            royaltyByDesigner[designerUserId].amount += royaltyAmount;
            royaltyByDesigner[designerUserId].sales += 1;
            royaltyByDesigner[designerUserId].designs.add(item.designId);
        }

        console.log(`Processing royalties for ${Object.keys(royaltyByDesigner).length} designers`);

        // 3. Update each designer's account
        const updates = [];
        for (const [userId, data] of Object.entries(royaltyByDesigner)) {
            // Get current values
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { royaltyPoints: true, royaltyEarnings: true, name: true }
            });

            if (!user) continue;

            // Set to the calculated total (overwrite, not increment)
            // This ensures idempotency - running migration multiple times won't duplicate credits
            await prisma.user.update({
                where: { id: userId },
                data: {
                    royaltyPoints: data.amount, // Set to total, not increment
                    royaltyEarnings: data.amount
                }
            });

            updates.push({
                userId,
                name: user.name,
                previousPoints: user.royaltyPoints,
                newPoints: data.amount,
                credited: data.amount - user.royaltyPoints,
                sales: data.sales,
                uniqueDesigns: data.designs.size
            });

            console.log(`✅ Credited ${data.amount} points to ${user.name} (was ${user.royaltyPoints})`);
        }

        return NextResponse.json({
            success: true,
            message: `Migration completed successfully`,
            summary: {
                totalDesigners: updates.length,
                totalOrderItems: paidOrderItems.length,
                updates
            }
        });

    } catch (error: any) {
        console.error("Royalty migration error:", error);
        return NextResponse.json(
            { error: "Failed to migrate royalties", details: error.message },
            { status: 500 }
        );
    }
}
