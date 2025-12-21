"use client";

import React from "react";

// Base skeleton with shimmer animation
export function Skeleton({ className = "" }: { className?: string }) {
    return (
        <div
            className={`animate-pulse bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 bg-[length:200%_100%] animate-shimmer rounded ${className}`}
            style={{
                animation: "shimmer 1.5s ease-in-out infinite",
            }}
        />
    );
}

// Product card skeleton
export function ProductCardSkeleton() {
    return (
        <div className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
            {/* Image placeholder */}
            <Skeleton className="aspect-square w-full" />

            {/* Content */}
            <div className="p-4 space-y-3">
                {/* Title */}
                <Skeleton className="h-5 w-3/4" />

                {/* Category */}
                <Skeleton className="h-4 w-1/2" />

                {/* Price */}
                <Skeleton className="h-6 w-1/3" />

                {/* Button */}
                <Skeleton className="h-10 w-full rounded-lg" />
            </div>
        </div>
    );
}

// Product grid skeleton (multiple cards)
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <ProductCardSkeleton key={i} />
            ))}
        </div>
    );
}

// Order card skeleton
export function OrderCardSkeleton() {
    return (
        <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 space-y-4">
            <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="flex gap-4">
                <Skeleton className="h-20 w-20 rounded-lg" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-5 w-1/4" />
                </div>
            </div>
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

// Design card skeleton (for community)
export function DesignCardSkeleton() {
    return (
        <div className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
            {/* Image */}
            <Skeleton className="aspect-square w-full" />

            {/* User info */}
            <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                </div>
            </div>
        </div>
    );
}

// Profile skeleton
export function ProfileSkeleton() {
    return (
        <div className="space-y-6">
            {/* Banner */}
            <Skeleton className="h-48 w-full rounded-xl" />

            {/* Avatar & name */}
            <div className="flex items-center gap-4 -mt-12 px-6">
                <Skeleton className="h-24 w-24 rounded-full border-4 border-zinc-900" />
                <div className="space-y-2 pt-8">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6 px-6">
                <Skeleton className="h-16 w-24 rounded-lg" />
                <Skeleton className="h-16 w-24 rounded-lg" />
                <Skeleton className="h-16 w-24 rounded-lg" />
            </div>
        </div>
    );
}

// Dashboard stat card skeleton
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

// Dashboard skeleton
export function DashboardSkeleton() {
    return (
        <div className="space-y-6">
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

// Cart skeleton
export function CartSkeleton() {
    return (
        <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-4 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                    <Skeleton className="h-24 w-24 rounded-lg" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <div className="flex justify-between items-center">
                            <Skeleton className="h-8 w-24" />
                            <Skeleton className="h-6 w-16" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Text line skeleton
export function TextSkeleton({ lines = 3 }: { lines?: number }) {
    return (
        <div className="space-y-2">
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={`h-4 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
                />
            ))}
        </div>
    );
}
