import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateTOTP } from "@/lib/2fa";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
    try {
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

        // Log the code for development
        console.log(`[2FA] Code for ${email}: ${code}`);

        // Send email via Resend
        const apiKey = process.env.RESEND_API_KEY;
        let emailSent = false;
        let emailError = null;

        if (apiKey) {
            console.log(`[2FA] Attempting to send email to ${email}...`);
            try {
                const resend = new Resend(apiKey);
                const result = await resend.emails.send({
                    from: 'DropXCult <onboarding@resend.dev>',
                    to: email,
                    subject: '🔐 Your Admin Login Verification Code',
                    html: `
                        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px; background: #0a0a0a; color: #fff; border-radius: 12px;">
                            <div style="text-align: center; margin-bottom: 30px;">
                                <h1 style="color: #dc2626; margin: 0; font-size: 28px;">CULT CONTROL</h1>
                                <p style="color: #666; margin-top: 8px; font-size: 14px;">Admin Panel Security</p>
                            </div>
                            
                            <div style="background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 30px; text-align: center;">
                                <p style="color: #a1a1aa; margin: 0 0 20px; font-size: 14px;">Your verification code is:</p>
                                <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); border-radius: 8px; padding: 20px; margin: 0 auto; max-width: 200px;">
                                    <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #fff; font-family: monospace;">${code}</span>
                                </div>
                                <p style="color: #71717a; margin: 20px 0 0; font-size: 12px;">
                                    This code expires in <strong style="color: #fbbf24;">5 minutes</strong>
                                </p>
                            </div>
                            
                            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #27272a; text-align: center;">
                                <p style="color: #52525b; font-size: 12px; margin: 0;">
                                    ⚠️ If you didn't request this code, please ignore this email.
                                </p>
                                <p style="color: #3f3f46; font-size: 11px; margin-top: 10px;">
                                    © ${new Date().getFullYear()} DropXCult. All rights reserved.
                                </p>
                            </div>
                        </div>
                    `,
                });
                console.log(`[2FA] ✅ Email sent successfully!`, result);
                emailSent = true;
            } catch (err: any) {
                console.error("[2FA] ❌ Email send failed:", err?.message || err);
                emailError = err?.message || "Unknown error";
            }
        } else {
            console.log("[2FA] ⚠️ RESEND_API_KEY not configured");
        }

        return NextResponse.json({
            success: true,
            message: emailSent
                ? "Verification code sent to your email"
                : "Verification code generated (check toast/console)",
            emailSent,
            emailError,
            // DEV ONLY - always show code in dev
            devCode: code,
        });
    } catch (error: any) {
        console.error("2FA send error:", error);
        return NextResponse.json({ error: error?.message || "Failed to send verification code" }, { status: 500 });
    }
}
