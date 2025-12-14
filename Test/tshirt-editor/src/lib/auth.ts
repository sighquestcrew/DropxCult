'use client';

export interface AuthUser {
    id: string;
    token: string;
    name: string;
    isAdmin?: boolean;
}

export function getUserFromUrl(): AuthUser | null {
    if (typeof window === 'undefined') return null;

    const params = new URLSearchParams(window.location.search);
    const userId = params.get('userId');
    const token = params.get('token');
    const userName = params.get('userName');
    const isAdmin = params.get('isAdmin') === 'true';

    if (!userId || !token) {
        return null;
    }

    return {
        id: userId,
        token: token,
        name: userName || 'Guest',
        isAdmin: isAdmin
    };
}

export function saveUserToSession(user: AuthUser) {
    if (typeof window !== 'undefined') {
        sessionStorage.setItem('user', JSON.stringify(user));
    }
}

export function getUserFromSession(): AuthUser | null {
    if (typeof window === 'undefined') return null;

    const userStr = sessionStorage.getItem('user');
    if (!userStr) return null;

    try {
        return JSON.parse(userStr);
    } catch {
        return null;
    }
}

export function clearUserSession() {
    if (typeof window !== 'undefined') {
        sessionStorage.removeItem('user');
    }
}
