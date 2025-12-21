import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST: Credit referral rewards after first purchase
export async function POST(req: Request) {
    try {
        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 });
        }

        // Find pending referral for this user
        const referral = await prisma.referral.findUnique({
            where: { refereeId: userId }
        });

        if (!referral) {
            return NextResponse.json({ message: "No referral to credit" });
        }

        if (referral.status === "credited") {
            return NextResponse.json({ message: "Already credited" });
        }

        // Check if user has made a purchase
        const hasOrder = await prisma.order.findFirst({
            where: {
                userId,
                isPaid: true
            }
        });

        if (!hasOrder) {
            return NextResponse.json({ message: "No paid order yet" });
        }

        // Credit both users
        await prisma.$transaction([
            // Credit referrer
            prisma.user.update({
                where: { id: referral.referrerId },
                data: {
                    referralCredits: { increment: referral.rewardAmount }
                }
            }),
            // Credit referee
            prisma.user.update({
                where: { id: referral.refereeId },
                data: {
                    referralCredits: { increment: referral.rewardAmount }
                }
            }),
            // Mark referral as credited
            prisma.referral.update({
                where: { id: referral.id },
                data: {
                    status: "credited",
                    creditedAt: new Date()
                }
            })
        ]);

        return NextResponse.json({
            success: true,
            message: `₹${referral.rewardAmount} credited to both users!`
        });

    } catch (error) {
        console.error("Credit referral error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
