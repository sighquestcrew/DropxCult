import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            orderId,
        } = await req.json();

        // Validate required fields
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
            return NextResponse.json(
                { error: "Missing required payment verification fields" },
                { status: 400 }
            );
        }

        // Generate signature for verification
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
            .update(body.toString())
            .digest("hex");

        // Verify signature
        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            // Update order status in database
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    isPaid: true,
                    paidAt: new Date(),
                    paymentResult: {
                        id: razorpay_payment_id,
                        status: "completed",
                        razorpay_order_id,
                        razorpay_signature,
                    },
                },
            });

            return NextResponse.json({
                success: true,
                message: "Payment verified successfully",
                orderId,
                paymentId: razorpay_payment_id,
            });
        } else {
            // Payment verification failed
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    paymentResult: {
                        id: razorpay_payment_id,
                        status: "failed",
                        error: "Signature verification failed",
                    },
                },
            });

            return NextResponse.json(
                { error: "Payment verification failed - invalid signature" },
                { status: 400 }
            );
        }
    } catch (error: any) {
        console.error("Payment Verification Error:", error);
        return NextResponse.json(
            { error: error.message || "Payment verification failed" },
            { status: 500 }
        );
    }
}
