import { jwtVerify } from 'jose';

export async function verifyAuth(token: string) {
    try {
        // MATCHING LOGIC WITH middleware.ts and api/2fa/verify/route.ts
        const secretValue = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret";
        const secret = new TextEncoder().encode(secretValue);
        const { payload } = await jwtVerify(token, secret);
        return payload;
    } catch (err) {
        return null;
    }
}

export async function getTokenFromRequest(req: Request) {
    // First, try to get token from HttpOnly cookie (primary method after 2FA migration)
    // Cast to NextRequest to access cookies
    const nextReq = req as any;
    if (nextReq.cookies?.get) {
        const cookieToken = nextReq.cookies.get("admin_token")?.value;
        if (cookieToken) {
            return cookieToken;
        }
    }

    // Fallback: check Authorization header (legacy/backwards compatibility)
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
        return authHeader.split(" ")[1];
    }

    return null;
}
