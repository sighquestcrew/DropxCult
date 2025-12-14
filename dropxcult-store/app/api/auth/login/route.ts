import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { logAudit } from "@/lib/audit";
import { authRateLimit } from "@/lib/rateLimit";

// ✅ SECURITY FIX: Whitelist allowed origins, not "*"
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_BASE_URL,
  process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : null,
  process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null,
].filter(Boolean) as string[];

const getCorsHeaders = (origin: string | null) => {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  return headers;
};

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin");
  return NextResponse.json({}, { headers: getCorsHeaders(origin) });
}

export async function POST(req: Request) {
  try {
    // ✅ SECURITY FIX: Rate limiting (5 attempts per 15 minutes)
    const rateLimitResult = await authRateLimit(req);
    if (rateLimitResult) return rateLimitResult;

    const { email, password } = await req.json();
    const origin = req.headers.get("origin");

    // 1. Find User
    const user = await prisma.user.findUnique({ where: { email } });

    // ✅ SECURITY FIX: Prevent timing attack (always hash even if user doesn't exist)
    const passwordHash = user?.password || await bcrypt.hash("dummy-password-to-prevent-timing-attack", 10);
    const passwordMatch = await bcrypt.compare(password, passwordHash);

    // 2. Check Password
    if (user && passwordMatch) {

      // 3. Issue Token (reduced from 30d to 24h for security)
      const token = jwt.sign(
        { _id: user.id, isAdmin: user.isAdmin },
        process.env.NEXTAUTH_SECRET!,
        { expiresIn: "24h" } // ✅ SECURITY FIX: Reduced from 30 days
      );

      // Audit log: successful login
      await logAudit({
        userId: user.id,
        userEmail: user.email,
        userRole: user.isAdmin ? "admin" : "user",
        action: "LOGIN",
        entity: "User",
        entityId: user.id,
      });

      return NextResponse.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        token,
      }, { headers: getCorsHeaders(origin) });
    } else {
      // Audit log: failed login attempt
      await logAudit({
        userEmail: email,
        action: "LOGIN_FAILED",
        entity: "User",
        status: "FAILURE",
        errorMessage: "Invalid credentials",
      });

      // ✅ SECURITY FIX: Generic message (don't reveal if email exists)
      return NextResponse.json({
        error: "Invalid credentials"
      }, { status: 401, headers: getCorsHeaders(origin) });
    }
  } catch (error) {
    console.error("Login Error:", error);
    const origin = req.headers.get("origin");
    return NextResponse.json({ error: "Server Error" }, { status: 500, headers: getCorsHeaders(origin) });
  }
}