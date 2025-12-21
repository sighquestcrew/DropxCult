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

// GET: Fetch all coupons
export async function GET(req: Request) {
    try {
        const admin = getAdmin(req);
        if (!admin) {
            return NextResponse.json({ error: "Admin only" }, { status: 403 });
        }

        const coupons = await prisma.coupon.findMany({
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(coupons);

    } catch (error: any) {
        console.error("Coupons Fetch Error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

// POST: Create new coupon
export async function POST(req: Request) {
    try {
        const admin = getAdmin(req);
        if (!admin) {
            return NextResponse.json({ error: "Admin only" }, { status: 403 });
        }

        const { code, discountType, discountValue, minOrderAmount, maxUses, expiresAt } = await req.json();

        if (!code || !discountValue) {
            return NextResponse.json({ error: "Code and discount value are required" }, { status: 400 });
        }

        // Check if code already exists
        const existing = await prisma.coupon.findUnique({
            where: { code: code.toUpperCase() }
        });

        if (existing) {
            return NextResponse.json({ error: "Coupon code already exists" }, { status: 400 });
        }

        const coupon = await prisma.coupon.create({
            data: {
                code: code.toUpperCase(),
                discountType: discountType || "percentage",
                discountValue: parseFloat(discountValue),
                minOrderAmount: parseFloat(minOrderAmount || 0),
                maxUses: maxUses ? parseInt(maxUses) : null,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
            }
        });

        return NextResponse.json({ success: true, coupon });

    } catch (error: any) {
        console.error("Coupon Create Error:", error);
        return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 });
    }
}

// DELETE: Delete coupon
export async function DELETE(req: Request) {
    try {
        const admin = getAdmin(req);
        if (!admin) {
            return NextResponse.json({ error: "Admin only" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Coupon ID required" }, { status: 400 });
        }

        await prisma.coupon.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Coupon Delete Error:", error);
        return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 });
    }
}

// PATCH: Toggle coupon active status
export async function PATCH(req: Request) {
    try {
        const admin = getAdmin(req);
        if (!admin) {
            return NextResponse.json({ error: "Admin only" }, { status: 403 });
        }

        const { id, isActive } = await req.json();

        if (!id) {
            return NextResponse.json({ error: "Coupon ID required" }, { status: 400 });
        }

        const coupon = await prisma.coupon.update({
            where: { id },
            data: { isActive }
        });

        return NextResponse.json({ success: true, coupon });

    } catch (error: any) {
        console.error("Coupon Update Error:", error);
        return NextResponse.json({ error: "Failed to update coupon" }, { status: 500 });
    }
}
