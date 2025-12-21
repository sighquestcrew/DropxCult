import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET: Search products by query
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get("q") || "";

        if (query.length < 2) {
            return NextResponse.json([]);
        }

        // Search in product name, description, and category
        const products = await prisma.product.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: "insensitive" } },
                    { description: { contains: query, mode: "insensitive" } },
                    { category: { contains: query, mode: "insensitive" } },
                ]
            },
            select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                images: true,
                category: true,
            },
            take: 10,
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(products);

    } catch (error: any) {
        console.error("Search Error:", error);
        return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
}
