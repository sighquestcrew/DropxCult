/**
 * In-memory Rate Limiter using Token Bucket Algorithm
 * Protects API endpoints from abuse
 */

interface RateLimitConfig {
    maxRequests: number;    // Max requests allowed
    windowMs: number;       // Time window in milliseconds
}

interface RateLimitEntry {
    tokens: number;
    lastRefill: number;
}

// In-memory store (use Redis in production for distributed systems)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries periodically
setInterval(() => {
    const now = Date.now();
    rateLimitStore.forEach((entry, key) => {
        if (now - entry.lastRefill > 60000) { // 1 minute
            rateLimitStore.delete(key);
        }
    });
}, 60000);

// Default configs for different endpoints
export const RATE_LIMITS = {
    auth: { maxRequests: 5, windowMs: 60000 },      // 5 per minute
    register: { maxRequests: 3, windowMs: 60000 },  // 3 per minute
    payment: { maxRequests: 10, windowMs: 60000 },  // 10 per minute
    orders: { maxRequests: 20, windowMs: 60000 },   // 20 per minute
    default: { maxRequests: 100, windowMs: 60000 }, // 100 per minute
} as const;

/**
 * Check if request is rate limited
 * @param identifier - Unique identifier (IP + endpoint)
 * @param config - Rate limit configuration
 * @returns { limited: boolean, remaining: number, resetIn: number }
 */
export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig = RATE_LIMITS.default
): { limited: boolean; remaining: number; resetIn: number } {
    const now = Date.now();
    let entry = rateLimitStore.get(identifier);

    // Initialize new entry
    if (!entry) {
        entry = {
            tokens: config.maxRequests - 1,
            lastRefill: now,
        };
        rateLimitStore.set(identifier, entry);
        return { limited: false, remaining: entry.tokens, resetIn: config.windowMs };
    }

    // Calculate tokens to add based on time passed
    const timePassed = now - entry.lastRefill;
    const tokensToAdd = Math.floor(timePassed / config.windowMs) * config.maxRequests;

    if (tokensToAdd > 0) {
        entry.tokens = Math.min(config.maxRequests, entry.tokens + tokensToAdd);
        entry.lastRefill = now;
    }

    // Check if rate limited
    if (entry.tokens <= 0) {
        const resetIn = config.windowMs - (now - entry.lastRefill);
        return { limited: true, remaining: 0, resetIn };
    }

    // Consume a token
    entry.tokens--;
    rateLimitStore.set(identifier, entry);

    return {
        limited: false,
        remaining: entry.tokens,
        resetIn: config.windowMs - (now - entry.lastRefill),
    };
}

/**
 * Get client IP from request
 */
export function getClientIP(req: Request): string {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }
    return req.headers.get("x-real-ip") || "unknown";
}

/**
 * Rate limit response helper
 */
export function rateLimitResponse(resetIn: number) {
    return new Response(
        JSON.stringify({
            error: "Too many requests. Please try again later.",
            retryAfter: Math.ceil(resetIn / 1000),
        }),
        {
            status: 429,
            headers: {
                "Content-Type": "application/json",
                "Retry-After": String(Math.ceil(resetIn / 1000)),
            },
        }
    );
}
