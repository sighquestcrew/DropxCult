import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

// Get user from token
const getUser = (req: Request) => {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    const token = authHeader.split(" ")[1];
    try {
        return jwt.verify(token, process.env.NEXTAUTH_SECRET!) as { _id: string; name: string; email: string };
    } catch {
        return null;
    }
};

export async function GET(req: Request) {
    try {
        const user = getUser(req);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const preOrders = await prisma.preOrderEntry.findMany({
            where: { userId: user._id },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                name: true,
                                images: true,
                                slug: true
                            }
                        }
                    }
                },
                campaign: {
                    select: {
                        name: true,
                        endDate: true,
                        deliveryDays: true,
                        status: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ preOrders });

    } catch (error: any) {
        console.error("Fetch Pre-Orders Error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
