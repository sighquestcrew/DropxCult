import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const rateLimitMap = new Map();

export function middleware(request: NextRequest) {
    const response = NextResponse.next();
    const ip = request.ip || '127.0.0.1';

    // 🛑 Rate Limiting (Basic In-Memory)
    // Only apply to /api routes
    if (request.nextUrl.pathname.startsWith('/api')) {
        const limit = 20; // 20 requests per minute
        const windowMs = 60 * 1000;

        if (!rateLimitMap.has(ip)) {
            rateLimitMap.set(ip, { count: 0, lastReset: Date.now() });
        }

        const ipData = rateLimitMap.get(ip);

        // Reset if window has passed
        if (Date.now() - ipData.lastReset > windowMs) {
            ipData.count = 0;
            ipData.lastReset = Date.now();
        }

        if (ipData.count >= limit) {
            return new NextResponse(
                JSON.stringify({ error: "Too many requests" }),
                { status: 429, headers: { 'Content-Type': 'application/json' } }
            );
        }

        ipData.count += 1;
    }

    // ✅ Security Headers - Protection against common attacks

    // Prevent DNS prefetching for privacy
    response.headers.set('X-DNS-Prefetch-Control', 'on');

    // Force HTTPS (when deployed)
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');

    // Prevent clickjacking
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');

    // Prevent MIME type sniffing
    response.headers.set('X-Content-Type-Options', 'nosniff');

    // Enable XSS filter
    response.headers.set('X-XSS-Protection', '1; mode=block');

    // Control referrer information
    response.headers.set('Referrer-Policy', 'origin-when-cross-origin');

    // Restrict permissions
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    // Content Security Policy
    response.headers.set(
        'Content-Security-Policy',
        [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "img-src 'self' data: https: blob:",
            "font-src 'self' data: https://fonts.gstatic.com",
            "connect-src 'self' https://api.razorpay.com https://res.cloudinary.com",
            "media-src 'self' blob:",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'self'",
            "upgrade-insecure-requests"
        ].join('; ')
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
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
