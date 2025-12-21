"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
    children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthed, setIsAuthed] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Skip auth check on login page
        if (pathname === "/login") {
            setLoading(false);
            setIsAuthed(true);
            return;
        }

        // Check if user is logged in
        const userInfo = localStorage.getItem("adminUserInfo");
        if (!userInfo) {
            router.replace("/login");
            return;
        }

        try {
            const parsed = JSON.parse(userInfo);
            if (!parsed.token || !parsed.isAdmin) {
                router.replace("/login");
                return;
            }
            setIsAuthed(true);
        } catch {
            localStorage.removeItem("adminUserInfo");
            router.replace("/login");
            return;
        }

        setLoading(false);
    }, [pathname, router]);

    if (loading || !isAuthed) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <Loader2 className="animate-spin text-red-500" size={40} />
            </div>
        );
    }

    return <>{children}</>;
}
