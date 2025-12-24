"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Loader2, Package, Search, Clock, User, Mail, Truck, Calendar } from "lucide-react";
import dayjs from "dayjs";
import { toast } from "sonner";

export default function PreOrdersPage() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [selectedPreOrder, setSelectedPreOrder] = useState<any | null>(null);
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ["admin-preorders", search, page],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (search) params.append("search", search);
            params.append("page", page.toString());

            const { data } = await axios.get(`/api/preorders?${params.toString()}`);
            return data;
        },
    });

    // Update pre-order status mutation
    const updateStatusMutation = useMutation({
        mutationFn: async ({ preOrderId, updates }: { preOrderId: string; updates: any }) => {
            await axios.patch(`/api/preorders/${preOrderId}`, updates);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-preorders"] });
            toast.success("Pre-order updated successfully");
        },
        onError: () => {
            toast.error("Failed to update pre-order");
        }
    });

    const preOrders = data?.preOrders || [];
    const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

    if (isLoading && !data) {
        return (
            <div className="p-10 text-white">
                <Loader2 className="animate-spin h-8 w-8 text-red-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Pre-Orders</h1>
                <div className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-lg">
                    <span className="text-sm text-gray-400">Total: </span>
                    <span className="text-xl font-bold text-purple-400">{pagination.total}</span>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                <input
                    type="text"
                    placeholder="Search by order number, customer name, or email..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                />
            </div>

            {/* Pre-Orders Table */}
            <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-zinc-800 border-b border-zinc-700">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold text-gray-300">Order #</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-300">Date</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-300">Customer</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-300">Campaign</th>
                                <th className="px-4 py-3 text-right font-semibold text-gray-300">Amount</th>
                                <th className="px-4 py-3 text-center font-semibold text-gray-300">Payment</th>
                                <th className="px-4 py-3 text-center font-semibold text-gray-300">Status</th>
                                <th className="px-4 py-3 text-center font-semibold text-gray-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {preOrders.map((preOrder: any) => (
                                <tr key={preOrder.id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <Clock size={14} className="text-purple-500" />
                                            <span className="font-mono text-xs font-semibold">{preOrder.orderNumber}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 text-xs">
                                        {dayjs(preOrder.createdAt).format("DD MMM YYYY")}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div>
                                            <p className="font-medium">{preOrder.user?.name || "Guest"}</p>
                                            <p className="text-xs text-gray-500">{preOrder.user?.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div>
                                            <p className="text-purple-400 font-medium text-xs">{preOrder.campaign?.name}</p>
                                            <p className="text-xs text-gray-500">
                                                {preOrder.campaign?.status === 'active' ? '🔥 Active' : '✓ Completed'}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold">₹{preOrder.totalAmount.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`text-xs px-2 py-1 rounded-full ${preOrder.paymentStatus === 'paid'
                                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                            }`}>
                                            {preOrder.paymentStatus === 'paid' ? '✓ Paid' : '⏳ Pending'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <select
                                            value={preOrder.status}
                                            onChange={(e) => updateStatusMutation.mutate({
                                                preOrderId: preOrder.id,
                                                updates: { status: e.target.value }
                                            })}
                                            className="text-xs px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-white font-medium focus:border-purple-500 focus:outline-none"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="processing">Processing</option>
                                            <option value="shipped">Shipped</option>
                                            <option value="delivered">Delivered</option>
                                            <option value="refunded">Refunded</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => setSelectedPreOrder(preOrder)}
                                            className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded font-medium transition"
                                        >
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {preOrders.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <Package size={48} className="mx-auto mb-4 text-gray-700" />
                        <p>No pre-orders found</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg disabled:opacity-50 hover:bg-zinc-700 transition"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-400">
                        Page {page} of {pagination.totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                        disabled={page === pagination.totalPages}
                        className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg disabled:opacity-50 hover:bg-zinc-700 transition"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Details Modal */}
            {selectedPreOrder && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPreOrder(null)}>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-zinc-800">
                            <h2 className="text-2xl font-bold">Pre-Order Details</h2>
                            <p className="text-sm text-gray-500 mt-1">Order #{selectedPreOrder.orderNumber}</p>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Customer Info */}
                            <div>
                                <h3 className="font-bold mb-3 flex items-center gap-2">
                                    <User size={16} className="text-purple-500" />
                                    Customer Information
                                </h3>
                                <div className="bg-zinc-800 rounded-lg p-4 space-y-2 text-sm">
                                    <p><span className="text-gray-400">Name:</span> <span className="font-medium">{selectedPreOrder.user?.name}</span></p>
                                    <p><span className="text-gray-400">Email:</span> <span className="font-medium">{selectedPreOrder.user?.email}</span></p>
                                    {selectedPreOrder.phone && <p><span className="text-gray-400">Phone:</span> <span className="font-medium">{selectedPreOrder.phone}</span></p>}
                                </div>
                            </div>

                            {/* Shipping Address */}
                            {selectedPreOrder.shippingAddress && (
                                <div>
                                    <h3 className="font-bold mb-3 flex items-center gap-2">
                                        <Truck size={16} className="text-purple-500" />
                                        Delivery Address
                                    </h3>
                                    <div className="bg-zinc-800 rounded-lg p-4 text-sm">
                                        <p className="font-medium">{selectedPreOrder.shippingAddress.fullName}</p>
                                        <p className="text-gray-400 mt-2">{selectedPreOrder.shippingAddress.address}</p>
                                        <p className="text-gray-400">
                                            {selectedPreOrder.shippingAddress.city}, {selectedPreOrder.shippingAddress.state} - {selectedPreOrder.shippingAddress.postalCode}
                                        </p>
                                        {selectedPreOrder.shippingAddress.country && (
                                            <p className="text-gray-400">{selectedPreOrder.shippingAddress.country}</p>
                                        )}
                                        {selectedPreOrder.shippingAddress.phone && (
                                            <p className="text-gray-400 mt-2">📞 {selectedPreOrder.shippingAddress.phone}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Campaign Info */}
                            <div>
                                <h3 className="font-bold mb-3 flex items-center gap-2">
                                    <Calendar size={16} className="text-purple-500" />
                                    Campaign Details
                                </h3>
                                <div className="bg-zinc-800 rounded-lg p-4 space-y-2 text-sm">
                                    <p><span className="text-gray-400">Campaign:</span> <span className="font-medium text-purple-400">{selectedPreOrder.campaign?.name}</span></p>
                                    <p><span className="text-gray-400">Status:</span> <span className="font-medium">{selectedPreOrder.campaign?.status}</span></p>
                                    <p><span className="text-gray-400">Delivery:</span> <span className="font-medium">~{selectedPreOrder.campaign?.deliveryDays} days after campaign ends</span></p>
                                </div>
                            </div>

                            {/* Items */}
                            <div>
                                <h3 className="font-bold mb-3">Order Items</h3>
                                <div className="space-y-3">
                                    {selectedPreOrder.items?.map((item: any, i: number) => (
                                        <div key={i} className="flex gap-3 bg-zinc-800 rounded-lg p-3">
                                            <div className="w-16 h-16 bg-zinc-700 rounded overflow-hidden flex-shrink-0">
                                                {item.product?.images?.[0] && (
                                                    <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold">{item.product?.name}</p>
                                                <p className="text-xs text-gray-400">Size: {item.size} × {item.quantity}</p>
                                            </div>
                                            <p className="font-bold">₹{item.price * item.quantity}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Total */}
                            <div className="border-t border-zinc-800 pt-4">
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Total Amount</span>
                                    <span className="text-purple-400">₹{selectedPreOrder.totalAmount.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-zinc-800 flex justify-end">
                            <button
                                onClick={() => setSelectedPreOrder(null)}
                                className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
