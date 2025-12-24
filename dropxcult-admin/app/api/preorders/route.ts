import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {};
        if (search) {
            where.OR = [
                { orderNumber: { contains: search, mode: "insensitive" } },
                { user: { name: { contains: search, mode: "insensitive" } } },
                { user: { email: { contains: search, mode: "insensitive" } } }
            ];
        }

        // Fetch pre-orders with pagination
        const [preOrders, totalCount] = await Promise.all([
            prisma.preOrderEntry.findMany({
                where,
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true
                        }
                    },
                    items: {
                        include: {
                            product: {
                                select: {
                                    name: true,
                                    images: true,
                                    category: true,
                                    garmentType: true
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
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.preOrderEntry.count({ where })
        ]);

        return NextResponse.json({
            preOrders,
            pagination: {
                page,
                totalPages: Math.ceil(totalCount / limit),
                total: totalCount,
                limit
            }
        });

    } catch (error: any) {
        console.error("Admin Pre-Orders Fetch Error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
