import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

// Get user from token
const getUser = (req: Request) => {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    const token = authHeader.split(" ")[1];
    try {
        return jwt.verify(token, process.env.NEXTAUTH_SECRET!) as { _id: string; email: string; name: string };
    } catch {
        return null;
    }
};

// POST: Create a pre-order request
export async function POST(req: Request) {
    try {
        const user = getUser(req);
        if (!user) {
            return NextResponse.json({ error: "Please login to pre-order" }, { status: 401 });
        }

        const { productId, size, quantity, notes } = await req.json();

        if (!productId || !size) {
            return NextResponse.json({ error: "Product and size are required" }, { status: 400 });
        }

        // Check if product exists
        const product = await prisma.product.findUnique({
            where: { id: productId }
        });

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        // Check if user already has a pending pre-order for this product
        const existingPreorder = await prisma.preorder.findFirst({
            where: {
                userId: user._id,
                productId,
                size,
                status: "Pending"
            }
        });

        if (existingPreorder) {
            return NextResponse.json({ error: "You already have a pending pre-order for this product" }, { status: 400 });
        }

        // Create pre-order
        const preorder = await prisma.preorder.create({
            data: {
                userId: user._id,
                productId,
                size,
                quantity: quantity || 1,
                notes: notes || null,
                status: "Pending",
            }
        });

        return NextResponse.json({
            success: true,
            message: "Pre-order request submitted! We'll notify you when it's back in stock.",
            preorderId: preorder.id
        });

    } catch (error: any) {
        console.error("Pre-order Error:", error);
        return NextResponse.json({ error: "Failed to create pre-order" }, { status: 500 });
    }
}

// GET: Get user's pre-orders
export async function GET(req: Request) {
    try {
        const user = getUser(req);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const preorders = await prisma.preorder.findMany({
            where: { userId: user._id },
            include: {
                product: {
                    select: { id: true, name: true, slug: true, images: true, price: true }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(preorders);

    } catch (error: any) {
        console.error("Get Pre-orders Error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
