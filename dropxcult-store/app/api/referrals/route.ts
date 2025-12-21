import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

// Get user from token
const getUser = (req: Request) => {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    const token = authHeader.split(" ")[1];
    try {
        return jwt.verify(token, process.env.NEXTAUTH_SECRET!) as { _id: string };
    } catch {
        return null;
    }
};

// GET: Get user's referral info
export async function GET(req: Request) {
    try {
        const user = getUser(req);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userData = await prisma.user.findUnique({
            where: { id: user._id },
            select: {
                id: true,
                name: true,
                referralCode: true,
                referralCredits: true,
                referralsMade: {
                    include: {
                        referee: {
                            select: { name: true, createdAt: true }
                        }
                    },
                    orderBy: { createdAt: "desc" }
                }
            }
        });

        if (!userData) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Generate referral code if not exists
        let referralCode = userData.referralCode;
        if (!referralCode) {
            referralCode = `DROPX-${userData.id.substring(0, 6).toUpperCase()}`;
            await prisma.user.update({
                where: { id: userData.id },
                data: { referralCode }
            });
        }

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://dropxcult.com";

        return NextResponse.json({
            referralCode,
            referralLink: `${baseUrl}?ref=${referralCode}`,
            credits: userData.referralCredits,
            totalReferrals: userData.referralsMade.length,
            successfulReferrals: userData.referralsMade.filter(r => r.status === "credited").length,
            referrals: userData.referralsMade.map(r => ({
                refereeName: r.referee.name,
                status: r.status,
                reward: r.rewardAmount,
                date: r.createdAt
            }))
        });

    } catch (error) {
        console.error("Referral GET error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

// POST: Apply referral code (called during registration)
export async function POST(req: Request) {
    try {
        const { referralCode, userId } = await req.json();

        if (!referralCode || !userId) {
            return NextResponse.json({ error: "Missing data" }, { status: 400 });
        }

        // Find referrer by code
        const referrer = await prisma.user.findUnique({
            where: { referralCode: referralCode.toUpperCase() }
        });

        if (!referrer) {
            return NextResponse.json({ error: "Invalid referral code" }, { status: 400 });
        }

        // Can't refer yourself
        if (referrer.id === userId) {
            return NextResponse.json({ error: "Cannot use your own code" }, { status: 400 });
        }

        // Check if already referred
        const existingReferral = await prisma.referral.findUnique({
            where: { refereeId: userId }
        });

        if (existingReferral) {
            return NextResponse.json({ error: "Already referred" }, { status: 400 });
        }

        // Create referral record
        await prisma.referral.create({
            data: {
                referrerId: referrer.id,
                refereeId: userId,
                rewardAmount: 100,
                status: "pending"
            }
        });

        // Update referee's referredById
        await prisma.user.update({
            where: { id: userId },
            data: { referredById: referrer.id }
        });

        return NextResponse.json({
            success: true,
            message: "Referral code applied! You'll get ₹100 credit after first purchase."
        });

    } catch (error) {
        console.error("Referral POST error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
