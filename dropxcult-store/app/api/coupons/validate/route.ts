import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST: Validate and apply coupon
export async function POST(req: Request) {
    try {
        const { code, orderTotal } = await req.json();

        if (!code) {
            return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });
        }

        // Find coupon
        const coupon = await prisma.coupon.findUnique({
            where: { code: code.toUpperCase() }
        });

        if (!coupon) {
            return NextResponse.json({ error: "Invalid coupon code" }, { status: 404 });
        }

        // Check if active
        if (!coupon.isActive) {
            return NextResponse.json({ error: "This coupon is no longer active" }, { status: 400 });
        }

        // Check expiry
        if (coupon.expiresAt && new Date() > coupon.expiresAt) {
            return NextResponse.json({ error: "This coupon has expired" }, { status: 400 });
        }

        // Check usage limit
        if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
            return NextResponse.json({ error: "Invalid coupon code" }, { status: 400 });
        }

        // Check minimum order amount
        if (orderTotal < coupon.minOrderAmount) {
            return NextResponse.json({
                error: `Minimum order amount is ₹${coupon.minOrderAmount}`
            }, { status: 400 });
        }

        // Calculate discount
        let discountAmount = 0;
        if (coupon.discountType === "percentage") {
            discountAmount = Math.round((orderTotal * coupon.discountValue) / 100);
        } else {
            discountAmount = Math.min(coupon.discountValue, orderTotal); // Can't exceed order total
        }

        return NextResponse.json({
            valid: true,
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            discountAmount,
            message: coupon.discountType === "percentage"
                ? `${coupon.discountValue}% off applied!`
                : `₹${coupon.discountValue} off applied!`
        });

    } catch (error: any) {
        console.error("Coupon Validation Error:", error);
        return NextResponse.json({ error: "Failed to validate coupon" }, { status: 500 });
    }
}
