import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

/**
 * POST - Submit withdrawal request
 * User can request to withdraw their royalty points as money
 */
export async function POST(req: NextRequest) {
    try {
        const token = req.headers.get("authorization")?.split(" ")[1];
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as { _id: string };
        const userId = decoded._id;

        const body = await req.json();
        const { amount, accountName, accountNumber, ifscCode, bankName, upiId } = body;

        // Validation
        if (!amount || amount < 500) {
            return NextResponse.json(
                { error: "Minimum withdrawal amount is ₹500" },
                { status: 400 }
            );
        }

        if (!accountName || !accountNumber || !ifscCode || !bankName) {
            return NextResponse.json(
                { error: "All bank details are required" },
                { status: 400 }
            );
        }

        // IFSC code validation (11 characters, alphanumeric)
        const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
        if (!ifscRegex.test(ifscCode.toUpperCase())) {
            return NextResponse.json(
                { error: "Invalid IFSC code format" },
                { status: 400 }
            );
        }

        // Get user's current balance
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { royaltyPoints: true }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (user.royaltyPoints < amount) {
            return NextResponse.json(
                { error: `Insufficient balance. Available: ₹${user.royaltyPoints}` },
                { status: 400 }
            );
        }

        // Check for weekly limit (check for pending/approved requests in last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentRequests = await prisma.withdrawalRequest.findMany({
            where: {
                userId,
                createdAt: { gte: sevenDaysAgo },
                status: { in: ["pending", "approved", "processed"] }
            }
        });

        if (recentRequests.length > 0) {
            const lastRequest = recentRequests[0];
            return NextResponse.json(
                {
                    error: "You can only request withdrawal once per week",
                    nextAvailableDate: new Date(
                        lastRequest.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000
                    ).toISOString()
                },
                { status: 429 }
            );
        }

        const parsedAmount = parseFloat(amount);

        // Deduct amount
        await prisma.user.update({
            where: { id: userId },
            data: { royaltyPoints: { decrement: parsedAmount } }
        });

        // Create request
        const withdrawalRequest = await prisma.withdrawalRequest.create({
            data: {
                userId,
                amount: parsedAmount,
                accountName,
                accountNumber,
                ifscCode: ifscCode.toUpperCase(),
                bankName,
                upiId: upiId || null,
                status: "pending"
            }
        });

        return NextResponse.json({
            message: "Withdrawal request submitted successfully",
            request: {
                id: withdrawalRequest.id,
                amount: withdrawalRequest.amount,
                status: withdrawalRequest.status,
                createdAt: withdrawalRequest.createdAt
            }
        });

    } catch (error: any) {
        console.error("Withdrawal request error:", error);
        return NextResponse.json(
            { error: "Failed to submit withdrawal request", details: error.message },
            { status: 500 }
        );
    }
}

/**
 * GET - List user's withdrawal requests
 */
export async function GET(req: NextRequest) {
    try {
        const token = req.headers.get("authorization")?.split(" ")[1];
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as { _id: string };
        const userId = decoded._id;

        const requests = await prisma.withdrawalRequest.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 20
        });

        return NextResponse.json({ requests });

    } catch (error: any) {
        console.error("Fetch withdrawal requests error:", error);
        return NextResponse.json(
            { error: "Failed to fetch requests", details: error.message },
            { status: 500 }
        );
    }
}
