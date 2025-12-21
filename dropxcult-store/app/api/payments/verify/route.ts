import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { sendOrderConfirmation } from "@/lib/email";

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
            const order = await prisma.order.update({
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
                include: {
                    orderItems: true,
                    user: true,
                }
            });

            // Send order confirmation email
            if (order.user?.email) {
                const shippingAddr = order.shippingAddress as any;
                const address = shippingAddr
                    ? `${shippingAddr.fullName || ''}, ${shippingAddr.address || ''}, ${shippingAddr.city || ''}, ${shippingAddr.state || ''} - ${shippingAddr.postalCode || ''}`
                    : 'Address not available';

                await sendOrderConfirmation({
                    orderId: order.id,
                    customerName: order.user.name || 'Customer',
                    customerEmail: order.user.email,
                    items: order.orderItems.map((item: any) => ({
                        name: item.name,
                        size: item.size || 'N/A',
                        qty: item.qty,
                        price: item.price,
                    })),
                    total: order.totalPrice,
                    address,
                });
            }

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

