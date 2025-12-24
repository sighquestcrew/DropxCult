import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { paymentLimiter, getClientIp, checkRateLimit } from "@/lib/redis";

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_API_KEY!,
    key_secret: process.env.RAZORPAY_API_SECRET!,
});

// POST: Create Razorpay order
export async function POST(req: Request) {
    try {
        // ✅ SECURITY: Redis Rate Limiting (10 requests per minute)
        const ip = getClientIp(req);
        const { limited, headers, reset } = await checkRateLimit(paymentLimiter, ip);

        if (limited) {
            const retryAfter = Math.ceil((reset - Date.now()) / 1000);
            return new NextResponse(
                JSON.stringify({
                    error: "Too many payment requests. Please try again later.",
                    retryAfter: `${retryAfter} seconds`
                }),
                {
                    status: 429,
                    headers: {
                        "Content-Type": "application/json",
                        "Retry-After": retryAfter.toString(),
                        ...headers
                    }
                }
            );
        }

        const body = await req.json();
        const { amount } = body;

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
        }

        // Create Razorpay order
        const order = await razorpay.orders.create({
            amount: Math.round(amount * 100), // Convert to paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        });

        return NextResponse.json({
            id: order.id,
            amount: order.amount,
            currency: order.currency,
        });

    } catch (error: any) {
        console.error("Razorpay Order Error:", error);
        return NextResponse.json({
            error: error.message || "Failed to create payment order"
        }, { status: 500 });
    }
}
