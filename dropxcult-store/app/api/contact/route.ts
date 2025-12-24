import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { spamLimiter, getClientIp, checkRateLimit } from "@/lib/redis";

export async function POST(req: Request) {
    try {
        // ✅ SECURITY: Redis Rate Limiting (20 requests per minute)
        const ip = getClientIp(req);
        const { limited, headers, reset } = await checkRateLimit(spamLimiter, `contact:${ip}`);

        if (limited) {
            const retryAfter = Math.ceil((reset - Date.now()) / 1000);
            return new NextResponse(
                JSON.stringify({
                    error: "Too many contact requests. Please try again later.",
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
        const { name, email, subject, message } = body;

        if (!name || !email || !subject || !message) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        const inquiry = await prisma.inquiry.create({
            data: {
                name,
                email,
                subject,
                message,
                status: "Pending"
            }
        });

        return NextResponse.json(inquiry);
    } catch (error) {
        console.error("Contact API Error:", error);
        return NextResponse.json({ error: "Failed to submit inquiry" }, { status: 500 });
    }
}
