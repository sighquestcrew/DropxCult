"use client";

import { CheckCircle, XCircle, Clock, Truck, Package, Ban } from "lucide-react";

interface StatusBadgeProps {
    status: string;
    size?: "sm" | "md";
}

const statusConfig: Record<string, { color: string; bgColor: string; icon: React.ReactNode }> = {
    paid: { color: "text-green-500", bgColor: "bg-green-900/30 border-green-900/50", icon: <CheckCircle size={12} /> },
    unpaid: { color: "text-red-500", bgColor: "bg-red-900/30 border-red-900/50", icon: <XCircle size={12} /> },
    pending: { color: "text-yellow-500", bgColor: "bg-yellow-900/30 border-yellow-900/50", icon: <Clock size={12} /> },
    processing: { color: "text-blue-500", bgColor: "bg-blue-900/30 border-blue-900/50", icon: <Package size={12} /> },
    shipped: { color: "text-purple-500", bgColor: "bg-purple-900/30 border-purple-900/50", icon: <Truck size={12} /> },
    delivered: { color: "text-green-500", bgColor: "bg-green-900/30 border-green-900/50", icon: <CheckCircle size={12} /> },
    cancelled: { color: "text-gray-500", bgColor: "bg-gray-900/30 border-gray-900/50", icon: <Ban size={12} /> },
    admin: { color: "text-red-500", bgColor: "bg-red-900/30 border-red-900/50", icon: null },
    member: { color: "text-gray-400", bgColor: "bg-zinc-800 border-zinc-700", icon: null },
    approved: { color: "text-green-500", bgColor: "bg-green-900/30 border-green-900/50", icon: <CheckCircle size={12} /> },
    rejected: { color: "text-red-500", bgColor: "bg-red-900/30 border-red-900/50", icon: <XCircle size={12} /> },
};

export default function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
    const normalizedStatus = status.toLowerCase();
    const config = statusConfig[normalizedStatus] || {
        color: "text-gray-400",
        bgColor: "bg-zinc-800 border-zinc-700",
        icon: null
    };

    const sizeClasses = size === "sm" ? "text-xs px-2 py-1" : "text-sm px-3 py-1.5";

    return (
        <span className={`inline-flex items-center gap-1 rounded border font-bold uppercase ${config.color} ${config.bgColor} ${sizeClasses}`}>
            {config.icon}
            {status}
        </span>
    );
}
