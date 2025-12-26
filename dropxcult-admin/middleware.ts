import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// In-memory fallback for Edge runtime (middleware can't use full Redis client)
// Full Redis rate limiting is applied in API routes
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

export async function middleware(request: NextRequest) {
    const response = NextResponse.next();

    // Get IP from headers
    const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0] ||
        request.headers.get("x-real-ip") ||
        "127.0.0.1";

    // 🔒 STRICT SECURITY: API Route Protection
    if (request.nextUrl.pathname.startsWith("/api")) {
        // Exclude public routes
        const publicPaths = ["/api/auth/login", "/api/2fa"];
        if (publicPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
            return response; // validation happens in-route or not needed
        }

        // 1. Rate Limiting (Stricter for admin API)
        const limit = 20; // 20 requests per minute per IP
        const windowMs = 60 * 1000;

        if (!rateLimitMap.has(ip)) {
            rateLimitMap.set(ip, { count: 0, lastReset: Date.now() });
        }

        const ipData = rateLimitMap.get(ip)!;
        if (Date.now() - ipData.lastReset > windowMs) {
            ipData.count = 0;
            ipData.lastReset = Date.now();
        }

        if (ipData.count >= limit) {
            return new NextResponse(
                JSON.stringify({ error: "Too many requests" }),
                { status: 429, headers: { "Content-Type": "application/json" } }
            );
        }
        ipData.count += 1;

        // 2. Authentication Check (Gatekeeper)
        // Check for Cookie OR Header
        let token = request.cookies.get("admin_token")?.value;
        const authHeader = request.headers.get("authorization");

        if (!token && authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        }

        if (!token) {
            console.error(`⛔ Access Denied: No token found for ${request.nextUrl.pathname}`);
            return new NextResponse(
                JSON.stringify({ error: "Unauthorized: Missing authentication" }),
                { status: 401, headers: { "Content-Type": "application/json" } }
            );
        }

        try {
            // We verify manually here to keep middleware standalone-ish, 
            // or import from lib/auth if we can ensure edge compatibility.
            // Using 'jose' directly here is safest for Middleware.
            const { jwtVerify } = await import('jose');

            // MATCHING LOGIC WITH api/2fa/verify/route.ts
            const secretValue = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret";
            const secret = new TextEncoder().encode(secretValue);

            const { payload } = await jwtVerify(token, secret);

            if (!payload) throw new Error("Invalid Token");

            // Check API Key/Role if payload has it
            if (!payload.isAdmin) {
                console.error(`⛔ User is not admin: isAdmin=${payload.isAdmin}`);
                throw new Error("Insufficient Permissions");
            }

        } catch (error: any) {
            console.error("❌ Middleware Auth Failed:", error?.message || error);
            return new NextResponse(
                JSON.stringify({ error: "Unauthorized: Invalid token" }),
                { status: 401, headers: { "Content-Type": "application/json" } }
            );
        }
    }

    // ✅ Security Headers - Critical for Admin Panel

    // Prevent embedding in iframes (Admin panel should never be embedded)
    response.headers.set("X-Frame-Options", "DENY");

    // Prevent MIME type sniffing
    response.headers.set("X-Content-Type-Options", "nosniff");

    // Enable XSS filter
    response.headers.set("X-XSS-Protection", "1; mode=block");

    // Force HTTPS
    response.headers.set(
        "Strict-Transport-Security",
        "max-age=63072000; includeSubDomains; preload"
    );

    // Referrer Policy
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    // Disable permissions not needed in admin
    response.headers.set(
        "Permissions-Policy",
        "camera=(), microphone=(), geolocation=(), payment=()"
    );

    // Content Security Policy
    const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // unsafe-eval needed for Next.js dev, unsafe-inline for some UI libs
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' blob: data: https://res.cloudinary.com https://*.cloudinary.com",
        "font-src 'self'",
        "connect-src 'self' https://res.cloudinary.com https://*.cloudinary.com",
    ].join("; ");

    response.headers.set("Content-Security-Policy", csp);

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
