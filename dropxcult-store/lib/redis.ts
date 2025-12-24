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
// Pre-configured Rate Limiters
// ============================================

/**
 * Auth Rate Limit - For login/register endpoints
 * 5 requests per 15 minutes per IP
 * Prevents brute force attacks
 */
export const authLimiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "15 m"),
        prefix: "ratelimit:auth",
        analytics: true,
    })
    : null;

/**
 * Upload Rate Limit - For file upload endpoints
 * 10 uploads per hour per IP
 * Prevents Cloudinary cost spikes
 */
export const uploadLimiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "1 h"),
        prefix: "ratelimit:upload",
        analytics: true,
    })
    : null;

/**
 * Payment Rate Limit - For payment creation
 * 10 requests per minute per IP
 * Prevents payment fraud/spam
 */
export const paymentLimiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "1 m"),
        prefix: "ratelimit:payment",
        analytics: true,
    })
    : null;

/**
 * Spam Rate Limit - For reviews, comments, contact forms
 * 20 requests per minute per IP
 * Prevents content spam
 */
export const spamLimiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(20, "1 m"),
        prefix: "ratelimit:spam",
        analytics: true,
    })
    : null;

/**
 * Global API Rate Limit - For general API protection
 * 100 requests per minute per IP
 * Prevents DDoS and API abuse
 */
export const globalLimiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, "1 m"),
        prefix: "ratelimit:global",
        analytics: true,
    })
    : null;

/**
 * Strict Rate Limit - For sensitive operations
 * 3 requests per minute per IP
 * For referral credits, 2FA resend, etc.
 */
export const strictLimiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, "1 m"),
        prefix: "ratelimit:strict",
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
