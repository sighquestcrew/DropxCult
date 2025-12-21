import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    if (!query.trim()) {
        return NextResponse.json({ products: [], orders: [], users: [], designs: [] });
    }

    try {
        // Search products
        const products = await prisma.product.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: "insensitive" } },
                    { category: { contains: query, mode: "insensitive" } },
                    { description: { contains: query, mode: "insensitive" } },
                ],
            },
            select: {
                id: true,
                name: true,
                category: true,
            },
            take: 5,
        });

        // Search orders by ID
        const orders = await prisma.order.findMany({
            where: {
                id: { contains: query, mode: "insensitive" },
            },
            select: {
                id: true,
                totalPrice: true,
                status: true,
            },
            take: 5,
        });

        // Search users
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: "insensitive" } },
                    { email: { contains: query, mode: "insensitive" } },
                ],
            },
            select: {
                id: true,
                name: true,
                email: true,
            },
            take: 5,
        });

        // Search designs (3D designs) - by name OR ID
        const designs = await prisma.design.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: "insensitive" } },
                    { id: { contains: query, mode: "insensitive" } },
                ],
            },
            select: {
                id: true,
                name: true,
                status: true,
            },
            take: 5,
        });

        return NextResponse.json({ products, orders, users, designs });
    } catch (error) {
        console.error("Search error:", error);
        return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
}

