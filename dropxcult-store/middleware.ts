import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const rateLimitMap = new Map();

export function middleware(request: NextRequest) {
    const response = NextResponse.next();
    // Get IP from headers (works in Vercel/Edge), fallback for local dev
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
        request.headers.get('x-real-ip') ||
        '127.0.0.1';

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
    // We must allow Razorpay frames and scripts
    response.headers.set(
        'Content-Security-Policy',
        [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "img-src 'self' data: https: blob:",
            "font-src 'self' data: https://fonts.gstatic.com",
            // Connect src needs stricter rules but must allow Razorpay domains
            "connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com https://*.razorpay.com https://res.cloudinary.com",
            "media-src 'self' blob:",
            "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com", // Allow Razorpay iframes
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            // Clean up frame-ancestors to avoid blocking ourselves if needed, generally 'self' is fine for main doc
            "frame-ancestors 'self'",
            // Remove upgrade-insecure-requests for localhost dev to work without HTTPS warnings
            // "upgrade-insecure-requests" 
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
