import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateTOTP } from "@/lib/2fa";
import { Resend } from "resend";
import { twoFaLimiter, getClientIp, checkRateLimit } from "@/lib/redis";

export async function POST(req: NextRequest) {
    try {
        // ✅ SECURITY: Redis Rate Limiting (3 requests per 5 minutes)
        const ip = getClientIp(req);
        const { limited, headers, reset } = await checkRateLimit(twoFaLimiter, ip);

        if (limited) {
            const retryAfter = Math.ceil((reset - Date.now()) / 1000);
            return new NextResponse(
                JSON.stringify({
                    error: "Too many 2FA requests. Please wait before requesting another code.",
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

        const { email, tempToken } = await req.json();

        if (!email || !tempToken) {
            return NextResponse.json({ error: "Email and temp token required" }, { status: 400 });
        }

        // Verify the user is an admin
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user || !user.isAdmin) {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        // Generate 2FA code
        const code = generateTOTP();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Store in database
        await prisma.twoFactorCode.upsert({
            where: { userId: user.id },
            update: {
                code,
                expiresAt,
                attempts: 0,
            },
            create: {
                userId: user.id,
                code,
                expiresAt,
                attempts: 0,
            },
        });

        // Send email via Resend
        const apiKey = process.env.RESEND_API_KEY;
        // Send to owner's email (the Resend registered email) instead of admin's email
        const ownerEmail = process.env.ADMIN_OTP_EMAIL || email;
        let emailSent = false;
        let emailError = null;

        if (apiKey && ownerEmail) {
            try {
                const resend = new Resend(apiKey);
                const result = await resend.emails.send({
                    from: 'DropXCult <onboarding@resend.dev>',
                    to: ownerEmail,
                    subject: `🔐 Admin Login: ${user.name || email} is trying to login`,
                    html: `
                        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px; background: #0a0a0a; color: #fff; border-radius: 12px;">
                            <div style="text-align: center; margin-bottom: 30px;">
                                <h1 style="color: #dc2626; margin: 0; font-size: 28px;">CULT CONTROL</h1>
                                <p style="color: #666; margin-top: 8px; font-size: 14px;">Admin Login Notification</p>
                            </div>
                            
                            <div style="background: #27272a; border: 1px solid #3f3f46; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                                <p style="color: #a1a1aa; margin: 0; font-size: 13px;">🧑‍💼 Admin trying to login:</p>
                                <p style="color: #fff; margin: 5px 0 0; font-size: 16px; font-weight: bold;">${user.name || 'Unknown'}</p>
                                <p style="color: #71717a; margin: 3px 0 0; font-size: 13px;">${email}</p>
                            </div>
                            
                            <div style="background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 30px; text-align: center;">
                                <p style="color: #a1a1aa; margin: 0 0 20px; font-size: 14px;">Their verification code is:</p>
                                <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); border-radius: 8px; padding: 20px; margin: 0 auto; max-width: 200px;">
                                    <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #fff; font-family: monospace;">${code}</span>
                                </div>
                                <p style="color: #71717a; margin: 20px 0 0; font-size: 12px;">
                                    This code expires in <strong style="color: #fbbf24;">5 minutes</strong>
                                </p>
                            </div>
                            
                            <div style="margin-top: 20px; padding: 15px; background: #422006; border: 1px solid #854d0e; border-radius: 8px;">
                                <p style="color: #fbbf24; margin: 0; font-size: 12px;">
                                    ⚠️ Only share this code if you recognize this admin and approve their login.
                                </p>
                            </div>
                            
                            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #27272a; text-align: center;">
                                <p style="color: #3f3f46; font-size: 11px; margin: 0;">
                                    © ${new Date().getFullYear()} DropXCult. All rights reserved.
                                </p>
                            </div>
                        </div>
                    `,
                });
                emailSent = true;
            } catch (err: any) {
                emailError = err?.message || "Unknown error";
            }
        }

        return NextResponse.json({
            success: true,
            message: emailSent
                ? "Verification code sent to your email"
                : "Verification code generated (check toast/console)",
            emailSent,
            emailError,
        });
    } catch (error: any) {
        console.error("2FA send error:", error);
        return NextResponse.json({ error: error?.message || "Failed to send verification code" }, { status: 500 });
    }
}
