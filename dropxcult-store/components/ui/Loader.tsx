"use client";

import { Loader2 } from "lucide-react";

interface SpinnerProps {
    size?: number;
    className?: string;
}

export function Spinner({ size = 16, className = "" }: SpinnerProps) {
    return (
        <Loader2
            size={size}
            className={`animate-spin ${className}`}
        />
    );
}

// Full page loading overlay
export function PageLoader() {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Loader2 size={48} className="animate-spin text-red-500" />
                <p className="text-white text-sm uppercase tracking-widest">Loading...</p>
            </div>
        </div>
    );
}

// Button with loading state
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    loading?: boolean;
    children: React.ReactNode;
}

export function LoadingButton({ loading, children, disabled, className, ...props }: LoadingButtonProps) {
    return (
        <button
            {...props}
            disabled={loading || disabled}
            className={`${className} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
            {loading ? (
                <span className="flex items-center justify-center gap-2">
                    <Spinner size={14} />
                    <span>Loading...</span>
                </span>
            ) : (
                children
            )}
        </button>
    );
}
