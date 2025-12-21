import { NextResponse } from "next/server";
import Razorpay from "razorpay";

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// POST: Create Razorpay order
export async function POST(req: Request) {
    try {
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
