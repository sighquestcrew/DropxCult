import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

/**
 * GET - List all withdrawal requests (Admin only)
 */
export async function GET(req: NextRequest) {
    try {
        // Get status filter from query params
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");

        const where = status ? { status } : {};

        const requests = await prisma.withdrawalRequest.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: 100
        });

        // Get user details for each request
        const requestsWithUsers = await Promise.all(
            requests.map(async (request) => {
                const user = await prisma.user.findUnique({
                    where: { id: request.userId },
                    select: { name: true, email: true }
                });

                return {
                    ...request,
                    userName: user?.name || "Unknown User",
                    userEmail: user?.email || ""
                };
            })
        );

        return NextResponse.json({ requests: requestsWithUsers });

    } catch (error: any) {
        console.error("Fetch withdrawal requests error:", error);
        return NextResponse.json(
            { error: "Failed to fetch requests", details: error.message },
            { status: 500 }
        );
    }
}
