// Rate Limiting Utility for Next.js API Routes
// Prevents brute force attacks and API abuse

interface RateLimitStore {
    [key: string]: {
        count: number;
        resetTime: number;
    };
}

const store: RateLimitStore = {};

interface RateLimitOptions {
    windowMs: number; // Time window in milliseconds
    max: number; // Max requests per window
    message?: string;
}

/**
 * Rate limiter for API routes
 * Usage: const limited = await rateLimit(req, { windowMs: 60000, max: 5 });
 */
export async function rateLimit(
    req: Request,
    options: RateLimitOptions
): Promise<Response | null> {
    const { windowMs, max, message = "Too many requests. Please try again later." } = options;

    // Get client identifier (IP address)
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';

    const key = `${ip}-${new URL(req.url).pathname}`;
    const now = Date.now();

    // Clean up old entries
    if (store[key] && store[key].resetTime < now) {
        delete store[key];
    }

    // Initialize or increment counter
    if (!store[key]) {
        store[key] = {
            count: 1,
            resetTime: now + windowMs
        };
    } else {
        store[key].count++;
    }

    // Check if limit exceeded
    if (store[key].count > max) {
        const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);

        return new Response(
            JSON.stringify({
                error: message,
                retryAfter: `${retryAfter} seconds`
            }),
            {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    'Retry-After': retryAfter.toString(),
                    'X-RateLimit-Limit': max.toString(),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': new Date(store[key].resetTime).toISOString()
                }
            }
        );
    }

    return null; // No rate limit hit
}

// Preset configurations for common use cases

export const authRateLimit = (req: Request) => rateLimit(req, {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: "Too many login attempts. Please try again in 15 minutes."
});

export const apiRateLimit = (req: Request) => rateLimit(req, {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100,
    message: "Too many requests. Please slow down."
});

export const uploadRateLimit = (req: Request) => rateLimit(req, {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: "Upload limit exceeded. Try again in 1 hour."
});

export const strictRateLimit = (req: Request) => rateLimit(req, {
    windowMs: 60 * 1000, // 1 minute
    max: 3,
    message: "Too many requests. Please wait before trying again."
});
