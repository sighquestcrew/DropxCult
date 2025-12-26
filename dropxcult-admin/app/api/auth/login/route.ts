import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { adminAuthLimiter, getClientIp, checkRateLimit } from "@/lib/redis";
import { logAudit } from "@/lib/audit";

export async function POST(req: Request) {
    try {
        // ✅ SECURITY: Redis Rate Limiting (5 attempts per 15 minutes)
        const ip = getClientIp(req);
        const { limited, headers, reset } = await checkRateLimit(adminAuthLimiter, ip);

        if (limited) {
            const retryAfter = Math.ceil((reset - Date.now()) / 1000);

            console.log("🛡️ [RATE LIMIT] Logging rate limit event for IP:", ip);
            try {
                await logAudit({
                    action: "RATE_LIMITED",
                    entity: "Security",
                    status: "DENIED",
                    details: { ip, reset },
                    errorMessage: "Too many login attempts"
                });
                console.log("✅ [RATE LIMIT] Log saved successfully");
            } catch (auditError) {
                console.error("❌ [RATE LIMIT] Failed to save audit log:", auditError);
            }

            return new NextResponse(
                JSON.stringify({
                    error: "Too many login attempts. Please try again later.",
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

        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
        }

        // 1. Find User
        const user = await prisma.user.findUnique({ where: { email } });

        // 2. Validate Password
        // Prevent timing attacks
        const passwordHash = user?.password || await bcrypt.hash("dummy", 10);
        const passwordMatch = await bcrypt.compare(password, passwordHash);

        if (user && passwordMatch) {
            // Validate Admin Status (Double Check)
            if (!user.isAdmin) {
                return NextResponse.json({ error: "Access Denied: Admins Only" }, { status: 403 });
            }

            // 3. ENFORCE 2FA - DO NOT ISSUE TOKEN YET
            // Instead of returning a token, we trigger the 2FA flow automatically here

            // Generate 2FA code
            const { generateTOTP } = await import("@/lib/2fa");
            const code = generateTOTP();
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

            // Store in database
            await prisma.twoFactorCode.upsert({
                where: { userId: user.id },
                update: { code, expiresAt, attempts: 0 },
                create: { userId: user.id, code, expiresAt, attempts: 0 },
            });

            // Send email (Reuse logic or call internal helper if refactored, for now simplified inline or assume frontend calls send)
            // Ideally, we should send it here to be atomic. 
            // For now, let's keep it simple: Return success, frontend calls /api/2fa/send or we rely on frontend's current flow.
            // BUT, to be secure, we must NOT return the token.

            // NOTE: The frontend currently calls /api/2fa/send after login. 
            // We can keep that flow for now, OR move sending here. 
            // To minimize frontend breakage, let's just STOP returning the token and let frontend trigger send.

            return NextResponse.json({
                require2fa: true,
                isAdmin: user.isAdmin,
                // Do NOT return token
            });

        } else {
            await logAudit({
                userId: user?.id, // might be undefined
                userEmail: email,
                userRole: "admin", // presumed
                action: "LOGIN_FAILED",
                entity: "User",
                status: "FAILURE",
                errorMessage: "Invalid credentials"
            });

            return NextResponse.json({
                error: "Invalid credentials"
            }, { status: 401 });
        }
    } catch (error) {
        console.error("Admin Login Error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
