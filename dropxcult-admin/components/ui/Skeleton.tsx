"use client";

import React from "react";

// Base skeleton with shimmer animation
export function Skeleton({ className = "" }: { className?: string }) {
    return (
        <div
            className={`animate-pulse bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 bg-[length:200%_100%] rounded ${className}`}
            style={{
                animation: "shimmer 1.5s ease-in-out infinite",
            }}
        />
    );
}

// Stat card skeleton
export function StatCardSkeleton() {
    return (
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-4 w-32" />
        </div>
    );
}

// Table row skeleton
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
    return (
        <tr className="border-b border-zinc-800">
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i} className="px-4 py-3">
                    <Skeleton className="h-4 w-full" />
                </td>
            ))}
        </tr>
    );
}

// Table skeleton
export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
    return (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-zinc-700 bg-zinc-800/50">
                        {Array.from({ length: columns }).map((_, i) => (
                            <th key={i} className="px-4 py-3 text-left">
                                <Skeleton className="h-4 w-20" />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: rows }).map((_, i) => (
                        <TableRowSkeleton key={i} columns={columns} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// Dashboard skeleton
export function DashboardSkeleton() {
    return (
        <div className="space-y-6 p-6">
            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
            </div>

            {/* Chart */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                <Skeleton className="h-6 w-40 mb-4" />
                <Skeleton className="h-64 w-full rounded-lg" />
            </div>

            {/* Recent orders */}
            <TableSkeleton rows={5} columns={5} />
        </div>
    );
}

// Design card skeleton
export function DesignCardSkeleton() {
    return (
        <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
            <div className="flex gap-4">
                <Skeleton className="h-20 w-20 rounded-lg" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
            </div>
        </div>
    );
}

// Design list skeleton
export function DesignListSkeleton({ count = 5 }: { count?: number }) {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
                <DesignCardSkeleton key={i} />
            ))}
        </div>
    );
}
