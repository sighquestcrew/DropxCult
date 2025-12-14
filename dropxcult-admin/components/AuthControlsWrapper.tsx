"use client";

import dynamic from "next/dynamic";

const AuthControls = dynamic(() => import("@/components/AuthControls"), {
    ssr: false,
    loading: () => (
        <div className="space-y-2">
            <div className="h-10 bg-zinc-800 rounded animate-pulse" />
        </div>
    )
});

export default function AuthControlsWrapper() {
    return <AuthControls />;
}
