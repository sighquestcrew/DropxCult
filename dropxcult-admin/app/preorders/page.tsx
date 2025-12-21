"use client";

import { useState, useEffect } from "react";
import { Bell, Package, User, Mail, Phone, CheckCircle, XCircle, Clock, Filter, Loader2 } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

interface Preorder {
    id: string;
    size: string;
    quantity: number;
    notes: string | null;
    status: string;
    createdAt: string;
    user: {
        id: string;
        name: string;
        email: string;
        phone?: string;
    };
    product: {
        id: string;
        name: string;
        slug: string;
        images: string[];
        price: number;
        stock: number;
    };
}

export default function PreordersPage() {
    const [preorders, setPreorders] = useState<Preorder[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const fetchPreorders = async () => {
        try {
            const userInfo = localStorage.getItem("adminUserInfo");
            const token = userInfo ? JSON.parse(userInfo).token : null;
            const { data } = await axios.get(`/api/preorders?status=${statusFilter}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPreorders(data);
        } catch (error) {
            toast.error("Failed to fetch pre-orders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPreorders();
    }, [statusFilter]);

    const updateStatus = async (preorderId: string, newStatus: string) => {
        setUpdatingId(preorderId);
        try {
            const userInfo = localStorage.getItem("adminUserInfo");
            const token = userInfo ? JSON.parse(userInfo).token : null;
            await axios.patch("/api/preorders", {
                preorderId,
                status: newStatus
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setPreorders(prev => prev.map(p =>
                p.id === preorderId ? { ...p, status: newStatus } : p
            ));
            toast.success(`Status updated to ${newStatus}`);
        } catch (error) {
            toast.error("Failed to update status");
        } finally {
            setUpdatingId(null);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            Pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
            Notified: "bg-blue-500/20 text-blue-400 border-blue-500/30",
            Completed: "bg-green-500/20 text-green-400 border-green-500/30",
            Cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
        };
        return styles[status] || "bg-gray-500/20 text-gray-400";
    };

    const pendingCount = preorders.filter(p => p.status === "Pending").length;

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
                        <Bell className="text-purple-400" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Pre-order Requests</h1>
                        <p className="text-gray-400 text-sm">
                            {pendingCount} pending request{pendingCount !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                {/* Filter */}
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-gray-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-zinc-800 border border-zinc-700 text-white rounded px-3 py-2 text-sm"
                    >
                        <option value="all">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Notified">Notified</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Pre-orders List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-purple-500" size={32} />
                </div>
            ) : preorders.length === 0 ? (
                <div className="text-center py-20 bg-zinc-900 border border-zinc-800 rounded-lg">
                    <Bell size={48} className="mx-auto mb-4 text-gray-600" />
                    <h2 className="text-xl font-bold text-white mb-2">No Pre-orders</h2>
                    <p className="text-gray-400">Pre-order requests will appear here</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {preorders.map((preorder) => (
                        <div
                            key={preorder.id}
                            className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 hover:border-zinc-700 transition-colors"
                        >
                            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                {/* Product Image */}
                                <div className="flex items-center gap-4 flex-1">
                                    <img
                                        src={preorder.product.images[0]}
                                        alt={preorder.product.name}
                                        className="w-16 h-16 rounded-lg object-cover border border-zinc-700"
                                    />
                                    <div>
                                        <h3 className="font-bold text-white">{preorder.product.name}</h3>
                                        <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                                            <span>Size: <strong className="text-white">{preorder.size}</strong></span>
                                            <span>Qty: <strong className="text-white">{preorder.quantity}</strong></span>
                                            <span>₹{preorder.product.price}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs mt-1">
                                            <Package size={12} className={preorder.product.stock > 0 ? "text-green-500" : "text-red-500"} />
                                            <span className={preorder.product.stock > 0 ? "text-green-400" : "text-red-400"}>
                                                {preorder.product.stock > 0 ? `${preorder.product.stock} in stock` : "Out of stock"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Customer Info */}
                                <div className="flex-1 text-sm">
                                    <div className="flex items-center gap-2 text-gray-300 mb-1">
                                        <User size={14} className="text-gray-500" />
                                        {preorder.user.name}
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <Mail size={14} className="text-gray-500" />
                                        {preorder.user.email}
                                    </div>
                                    {preorder.user.phone && (
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <Phone size={14} className="text-gray-500" />
                                            {preorder.user.phone}
                                        </div>
                                    )}
                                </div>

                                {/* Status & Actions */}
                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(preorder.status)}`}>
                                        {preorder.status}
                                    </span>

                                    {preorder.status === "Pending" && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => updateStatus(preorder.id, "Notified")}
                                                disabled={updatingId === preorder.id}
                                                className="p-2 bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600/30 transition-colors"
                                                title="Mark as Notified"
                                            >
                                                {updatingId === preorder.id ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                    <Bell size={16} />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => updateStatus(preorder.id, "Cancelled")}
                                                disabled={updatingId === preorder.id}
                                                className="p-2 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 transition-colors"
                                                title="Cancel"
                                            >
                                                <XCircle size={16} />
                                            </button>
                                        </div>
                                    )}

                                    {preorder.status === "Notified" && (
                                        <button
                                            onClick={() => updateStatus(preorder.id, "Completed")}
                                            disabled={updatingId === preorder.id}
                                            className="p-2 bg-green-600/20 text-green-400 rounded hover:bg-green-600/30 transition-colors"
                                            title="Mark as Completed"
                                        >
                                            {updatingId === preorder.id ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <CheckCircle size={16} />
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Notes */}
                            {preorder.notes && (
                                <div className="mt-3 pt-3 border-t border-zinc-800">
                                    <p className="text-sm text-gray-400">
                                        <span className="text-gray-500">Note:</span> {preorder.notes}
                                    </p>
                                </div>
                            )}

                            {/* Timestamp */}
                            <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                                <Clock size={12} />
                                {new Date(preorder.createdAt).toLocaleString()}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
