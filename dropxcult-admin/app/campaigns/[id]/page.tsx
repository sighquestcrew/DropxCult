"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft, Package, Users, TrendingUp, Clock, Download,
    Loader2, Mail, Truck, CheckCircle, Factory, AlertTriangle
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import Link from "next/link";

interface PreOrderItem {
    id: string;
    size: string;
    quantity: number;
    price: number;
}

interface PreOrder {
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    paymentStatus: string;
    createdAt: string;
    items: PreOrderItem[];
    user: { name: string; email: string };
}

interface Campaign {
    id: string;
    name: string;
    description: string | null;
    productId: string;
    product: { id: string; name: string; slug: string; images: string[]; price: number };
    startDate: string;
    endDate: string;
    minQuantity: number;
    maxQuantity: number | null;
    deliveryDays: number;
    status: string;
    totalOrders: number;
    totalQuantity: number;
    totalRevenue: number;
    sizeBreakdown: Record<string, number>;
    progress: number;
    preOrders: PreOrder[];
}

const STATUS_COLORS: Record<string, string> = {
    pending: "text-yellow-400",
    confirmed: "text-blue-400",
    in_production: "text-purple-400",
    ready_to_ship: "text-cyan-400",
    shipped: "text-green-400",
    delivered: "text-green-500",
    refunded: "text-red-400"
};

export default function CampaignDetailPage() {
    const params = useParams();
    const router = useRouter();
    const campaignId = params.id as string;

    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [loading, setLoading] = useState(true);

    const getToken = () => {
        const userInfo = localStorage.getItem("adminUserInfo");
        return userInfo ? JSON.parse(userInfo).token : null;
    };

    useEffect(() => {
        const fetchCampaign = async () => {
            try {
                const token = getToken();
                const { data } = await axios.get(`/api/campaigns?id=${campaignId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCampaign(data);
            } catch (error) {
                toast.error("Failed to fetch campaign");
                router.push("/campaigns");
            } finally {
                setLoading(false);
            }
        };

        if (campaignId) fetchCampaign();
    }, [campaignId, router]);

    const exportCSV = () => {
        if (!campaign) return;

        // Create CSV for printer
        const headers = ["Size", "Quantity"];
        const rows = Object.entries(campaign.sizeBreakdown)
            .sort(([a], [b]) => {
                const order = ["S", "M", "L", "XL", "XXL"];
                return order.indexOf(a) - order.indexOf(b);
            })
            .map(([size, qty]) => [size, qty.toString()]);

        const csvContent = [
            `Campaign: ${campaign.name}`,
            `Product: ${campaign.product.name}`,
            `Total Quantity: ${campaign.totalQuantity}`,
            "",
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n");

        // Download
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${campaign.name.replace(/\s+/g, "_")}_sizes.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("CSV exported!");
    };

    const exportOrders = () => {
        if (!campaign) return;

        const headers = ["Order #", "Customer", "Email", "Size", "Qty", "Amount", "Status", "Date"];
        const rows = campaign.preOrders.flatMap(order =>
            order.items.map(item => [
                order.orderNumber,
                order.user.name,
                order.user.email,
                item.size,
                item.quantity.toString(),
                `₹${order.totalAmount}`,
                order.status,
                new Date(order.createdAt).toLocaleDateString()
            ])
        );

        const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${campaign.name.replace(/\s+/g, "_")}_orders.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Orders exported!");
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-purple-500" size={32} />
            </div>
        );
    }

    if (!campaign) {
        return <div className="p-6 text-center text-gray-400">Campaign not found</div>;
    }

    const sizeOrder = ["S", "M", "L", "XL", "XXL"];
    const sortedSizes = Object.entries(campaign.sizeBreakdown).sort(([a], [b]) => {
        return sizeOrder.indexOf(a) - sizeOrder.indexOf(b);
    });
    const maxQty = Math.max(...Object.values(campaign.sizeBreakdown), 1);

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => router.push("/campaigns")}
                    className="p-2 hover:bg-zinc-800 rounded transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-white">{campaign.name}</h1>
                        <span className={`text-xs px-2 py-0.5 rounded capitalize font-medium ${campaign.status === "active" ? "bg-green-600" :
                                campaign.status === "closed" ? "bg-blue-600" :
                                    campaign.status === "fulfilled" ? "bg-purple-600" :
                                        campaign.status === "cancelled" ? "bg-red-600" : "bg-gray-600"
                            } text-white`}>
                            {campaign.status}
                        </span>
                    </div>
                    <p className="text-gray-400">{campaign.product.name}</p>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                        <Package size={18} />
                        <span className="text-sm">Total Quantity</span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                        {campaign.totalQuantity}
                        <span className="text-sm text-gray-500 font-normal"> / {campaign.minQuantity} min</span>
                    </p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                        <Users size={18} />
                        <span className="text-sm">Total Orders</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{campaign.preOrders.length}</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                        <TrendingUp size={18} />
                        <span className="text-sm">Revenue</span>
                    </div>
                    <p className="text-2xl font-bold text-green-400">₹{campaign.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                        <Clock size={18} />
                        <span className="text-sm">Progress</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{campaign.progress}%</p>
                </div>
            </div>

            {/* Size Breakdown */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-white">Size Breakdown (for Printer)</h2>
                    <button
                        onClick={exportCSV}
                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-medium text-sm transition-colors"
                    >
                        <Download size={16} />
                        Export CSV
                    </button>
                </div>

                {sortedSizes.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No orders yet</p>
                ) : (
                    <div className="space-y-3">
                        {sortedSizes.map(([size, qty]) => {
                            const percentage = Math.round((qty / campaign.totalQuantity) * 100);
                            const barWidth = Math.round((qty / maxQty) * 100);

                            return (
                                <div key={size} className="flex items-center gap-4">
                                    <div className="w-12 text-center font-bold text-white bg-zinc-800 py-2 rounded">
                                        {size}
                                    </div>
                                    <div className="flex-1">
                                        <div className="h-8 bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-end pr-3"
                                                style={{ width: `${barWidth}%` }}
                                            >
                                                {barWidth > 20 && (
                                                    <span className="text-xs font-bold">{qty}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-20 text-right">
                                        <span className="text-white font-bold">{qty}</span>
                                        <span className="text-gray-500 text-sm ml-1">({percentage}%)</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Total */}
                <div className="mt-6 pt-4 border-t border-zinc-700 flex justify-between items-center">
                    <span className="text-gray-400">Total to Print:</span>
                    <span className="text-2xl font-bold text-white">{campaign.totalQuantity} units</span>
                </div>
            </div>

            {/* Orders List */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                    <h2 className="font-bold text-white">Pre-Orders ({campaign.preOrders.length})</h2>
                    <button
                        onClick={exportOrders}
                        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        <Download size={14} />
                        Export All
                    </button>
                </div>

                {campaign.preOrders.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No orders yet</p>
                ) : (
                    <div className="divide-y divide-zinc-800">
                        {campaign.preOrders.map((order) => (
                            <div key={order.id} className="p-4 flex items-center gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-mono font-bold text-white">{order.orderNumber}</span>
                                        <span className={`text-xs capitalize ${STATUS_COLORS[order.status]}`}>
                                            {order.status.replace(/_/g, " ")}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-400">{order.user.name} • {order.user.email}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-white">₹{order.totalAmount}</p>
                                    <p className="text-xs text-gray-500">
                                        {order.items.map(i => `${i.size}×${i.quantity}`).join(", ")}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
