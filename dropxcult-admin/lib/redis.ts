import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Check if Redis is configured
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const isRedisConfigured = !!(REDIS_URL && REDIS_TOKEN);

// Log config status for debugging
if (!isRedisConfigured) {
    console.warn("[Redis] ⚠️ Rate limiting disabled - Redis not configured.");
} else {
    console.log("[Redis] ✅ Rate limiting enabled.");
}

// Initialize Redis client only if configured
export const redis = isRedisConfigured
    ? new Redis({ url: REDIS_URL!, token: REDIS_TOKEN! })
    : null;

// ============================================
// Admin-specific Rate Limiters
// ============================================

/**
 * Admin Auth Rate Limit - For admin login
 * 5 requests per 15 minutes per IP
 * Critical: Prevents brute force on admin panel
 */
export const adminAuthLimiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "15 m"),
        prefix: "ratelimit:admin:auth",
        analytics: true,
    })
    : null;

/**
 * 2FA Send Rate Limit - For 2FA code requests
 * 3 requests per 5 minutes per IP
 * Prevents email spam via 2FA
 */
export const twoFaLimiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, "5 m"),
        prefix: "ratelimit:admin:2fa",
        analytics: true,
    })
    : null;

/**
 * Global Admin API Rate Limit
 * 50 requests per minute per IP
 * Admin has fewer users, stricter limit
 */
export const adminGlobalLimiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(50, "1 m"),
        prefix: "ratelimit:admin:global",
        analytics: true,
    })
    : null;

// ============================================
// Helper Functions
// ============================================

/**
 * Get client IP from request headers
 */
export function getClientIp(req: Request): string {
    const forwarded = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    return forwarded?.split(",")[0]?.trim() || realIp || "127.0.0.1";
}

/**
 * Check rate limit and return result
 * Returns "not limited" if Redis is not configured (dev fallback)
 */
export async function checkRateLimit(
    limiter: Ratelimit | null,
    identifier: string
): Promise<{ limited: boolean; headers: Record<string, string>; reset: number }> {
    // If limiter is not available (Redis not configured), skip rate limiting
    if (!limiter) {
        console.log("[Redis] Rate limiting skipped - Redis not configured");
        return {
            limited: false,
            headers: {},
            reset: Date.now() + 60000,
        };
    }

    const result = await limiter.limit(identifier);

    const headers: Record<string, string> = {
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": new Date(result.reset).toISOString(),
    };

    return {
        limited: !result.success,
        headers,
        reset: result.reset,
    };
}

/**
 * Create a rate limit response
 */
export function rateLimitResponse(retryAfterMs: number): Response {
    const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);

    return new Response(
        JSON.stringify({
            error: "Too many requests. Please try again later.",
            retryAfter: `${retryAfterSeconds} seconds`,
        }),
        {
            status: 429,
            headers: {
                "Content-Type": "application/json",
                "Retry-After": retryAfterSeconds.toString(),
            },
        }
    );
}
