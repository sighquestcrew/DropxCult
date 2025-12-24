import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        hasRazorpayApiKey: !!process.env.RAZORPAY_API_KEY,
        hasRazorpayApiSecret: !!process.env.RAZORPAY_API_SECRET,
        hasPublicKey: !!process.env.NEXT_PUBLIC_RAZORPAY_API_KEY,

        // Show first 10 chars only for security
        razorpayApiKey: process.env.RAZORPAY_API_KEY?.substring(0, 10) || "MISSING",
        razorpayApiSecret: process.env.RAZORPAY_API_SECRET?.substring(0, 10) || "MISSING",
        publicKey: process.env.NEXT_PUBLIC_RAZORPAY_API_KEY?.substring(0, 10) || "MISSING",
    });
}
