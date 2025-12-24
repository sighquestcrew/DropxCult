import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// In-memory fallback for Edge runtime (middleware can't use full Redis client)
// Full Redis rate limiting is applied in API routes
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

export function middleware(request: NextRequest) {
    const response = NextResponse.next();

    // Get IP from headers
    const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0] ||
        request.headers.get("x-real-ip") ||
        "127.0.0.1";

    // 🛑 Basic Rate Limiting for Edge (APIs have additional Redis limiting)
    if (request.nextUrl.pathname.startsWith("/api")) {
        const limit = 50; // Admin has fewer users, stricter global limit
        const windowMs = 60 * 1000;

        if (!rateLimitMap.has(ip)) {
            rateLimitMap.set(ip, { count: 0, lastReset: Date.now() });
        }

        const ipData = rateLimitMap.get(ip)!;

        // Reset if window has passed
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
