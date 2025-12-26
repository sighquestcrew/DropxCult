import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { verifyTOTP, isTOTPExpired } from "@/lib/2fa";
import { logAudit } from "@/lib/audit";

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret";

export async function POST(req: NextRequest) {
    try {
        const { email, code, tempToken } = await req.json();

        if (!email || !code || !tempToken) {
            return NextResponse.json({ error: "Email, code, and temp token required" }, { status: 400 });
        }

        // Get user
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user || !user.isAdmin) {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        // Get stored 2FA code
        const storedCode = await prisma.twoFactorCode.findUnique({
            where: { userId: user.id },
        });

        if (!storedCode) {
            return NextResponse.json({ error: "No verification code found. Please request a new one." }, { status: 400 });
        }

        // Check if code expired
        if (isTOTPExpired(storedCode.expiresAt, 0)) {
            await prisma.twoFactorCode.delete({ where: { userId: user.id } });
            return NextResponse.json({ error: "Code expired. Please request a new one." }, { status: 400 });
        }

        // Check attempts (max 3)
        if (storedCode.attempts >= 3) {
            await prisma.twoFactorCode.delete({ where: { userId: user.id } });

            // Log failed attempt
            await logAudit({
                userId: user.id,
                userEmail: user.email,
                userRole: "admin",
                action: "LOGIN_FAILED",
                entity: "User",
                entityId: user.id,
                status: "DENIED",
                errorMessage: "Too many 2FA attempts",
            });

            return NextResponse.json({ error: "Too many attempts. Please request a new code." }, { status: 429 });
        }

        // Verify code
        if (!verifyTOTP(code, storedCode.code)) {
            // Increment attempts
            await prisma.twoFactorCode.update({
                where: { userId: user.id },
                data: { attempts: { increment: 1 } },
            });

            return NextResponse.json({
                error: "Invalid code",
                attemptsRemaining: 3 - (storedCode.attempts + 1)
            }, { status: 400 });
        }

        // Success! Delete the 2FA code
        await prisma.twoFactorCode.delete({ where: { userId: user.id } });

        // Generate JWT token
        // Generate JWT token
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                isAdmin: true,
                twoFactorVerified: true
            },
            JWT_SECRET,
            { expiresIn: "24h" } // Reduced to 24h for security
        );

        // Log successful 2FA login
        await logAudit({
            userId: user.id,
            userEmail: user.email,
            userRole: "admin",
            action: "LOGIN",
            entity: "User",
            entityId: user.id,
            details: { method: "2FA", twoFactorVerified: true },
            status: "SUCCESS",
        });

        const response = NextResponse.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                isAdmin: true,
                // token, // TOKEN NO LONGER RETURNED IN BODY
            },
        });

        // 🍪 SET HTTP-ONLY COOKIE
        const isProduction = process.env.NODE_ENV === "production";
        console.log(`🍪 Setting Cookie: Secure=${isProduction}, Env=${process.env.NODE_ENV}`);

        response.cookies.set("admin_token", token, {
            httpOnly: true,
            secure: isProduction, // Make sure this is false on localhost
            sameSite: "lax", // Relax to Lax for now to avoid Strict issues with redirects
            maxAge: 60 * 60 * 24, // 24 hours
            path: "/",
        });

        return response;
    } catch (error) {
        console.error("2FA verify error:", error);
        return NextResponse.json({ error: "Verification failed" }, { status: 500 });
    }
}
