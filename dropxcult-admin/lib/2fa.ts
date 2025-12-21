import crypto from 'crypto';

// Generate 6-digit TOTP code
export function generateTOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate secure token for 2FA session
export function generate2FAToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

// Verify TOTP code timing (codes valid for 5 minutes)
export function isTOTPExpired(createdAt: Date, expiryMinutes: number = 5): boolean {
    const now = new Date();
    const expiry = new Date(createdAt.getTime() + expiryMinutes * 60 * 1000);
    return now > expiry;
}

// Hash comparison for TOTP (timing-safe)
export function verifyTOTP(inputCode: string, storedCode: string): boolean {
    if (inputCode.length !== storedCode.length) return false;

    try {
        return crypto.timingSafeEqual(
            Buffer.from(inputCode),
            Buffer.from(storedCode)
        );
    } catch {
        return false;
    }
}
