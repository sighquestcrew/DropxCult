import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

// Verify admin token
const getAdmin = (req: Request) => {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    const token = authHeader.split(" ")[1];
    try {
        const user = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as { _id: string; isAdmin: boolean };
        return user.isAdmin ? user : null;
    } catch {
        return null;
    }
};

// GET: Fetch all pre-orders for admin
export async function GET(req: Request) {
    try {
        const admin = getAdmin(req);
        if (!admin) {
            return NextResponse.json({ error: "Admin only" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");

        const where = status && status !== "all" ? { status } : {};

        const preorders = await prisma.preorder.findMany({
            where,
            include: {
                user: {
                    select: { id: true, name: true, email: true, phone: true }
                },
                product: {
                    select: { id: true, name: true, slug: true, images: true, price: true, stock: true }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(preorders);

    } catch (error: any) {
        console.error("Admin Pre-orders Error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

// PATCH: Update pre-order status
export async function PATCH(req: Request) {
    try {
        const admin = getAdmin(req);
        if (!admin) {
            return NextResponse.json({ error: "Admin only" }, { status: 403 });
        }

        const { preorderId, status } = await req.json();

        if (!preorderId || !status) {
            return NextResponse.json({ error: "Preorder ID and status required" }, { status: 400 });
        }

        const validStatuses = ["Pending", "Notified", "Cancelled", "Completed"];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        const preorder = await prisma.preorder.update({
            where: { id: preorderId },
            data: { status }
        });

        return NextResponse.json({ success: true, preorder });

    } catch (error: any) {
        console.error("Update Pre-order Error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
