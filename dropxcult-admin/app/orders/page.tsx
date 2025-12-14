"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Loader2, CheckCircle, XCircle, Clock, Truck, Package, FileDown } from "lucide-react";
import dayjs from "dayjs";
import { toast } from "sonner";
import Pagination from "@/components/Pagination";
import { SearchInput, FilterTabs, DateRangePicker } from "@/components/Filters";
import StatusBadge from "@/components/StatusBadge";
import ExportButton from "@/components/ExportButton";

const ORDER_STATUSES = ["Processing", "Shipped", "Delivered", "Cancelled"];

export default function AdminOrdersPage() {
    const queryClient = useQueryClient();

    // Filter state
    const [search, setSearch] = useState("");
    const [paymentFilter, setPaymentFilter] = useState("");
    const [deliveryFilter, setDeliveryFilter] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [page, setPage] = useState(1);
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

    // Fetch orders with filters
    const { data, isLoading } = useQuery({
        queryKey: ["admin-orders", search, paymentFilter, deliveryFilter, startDate, endDate, page],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            if (paymentFilter) params.set("payment", paymentFilter);
            if (deliveryFilter) params.set("delivery", deliveryFilter);
            if (startDate) params.set("startDate", startDate);
            if (endDate) params.set("endDate", endDate);
            params.set("page", String(page));
            params.set("limit", "10");

            const { data } = await axios.get(`/api/orders?${params.toString()}`);
            return data;
        },
    });

    // Update order status mutation
    const updateStatusMutation = useMutation({
        mutationFn: async ({ orderId, updates }: { orderId: string; updates: any }) => {
            await axios.patch(`/api/orders/${orderId}`, updates);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
            toast.success("Order updated successfully");
        },
        onError: () => {
            toast.error("Failed to update order");
        }
    });

    // Bulk update mutation
    const bulkUpdateMutation = useMutation({
        mutationFn: async ({ orderIds, updates }: { orderIds: string[]; updates: any }) => {
            await Promise.all(orderIds.map(id => axios.patch(`/api/orders/${id}`, updates)));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
            setSelectedOrders([]);
            toast.success("Orders updated successfully");
        },
        onError: () => {
            toast.error("Failed to update orders");
        }
    });

    const orders = data?.orders || [];
    const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };
    const counts = data?.counts || { all: 0, paid: 0, unpaid: 0, delivered: 0, processing: 0 };

    // Tab configuration
    const tabs = [
        { value: "", label: "All", count: counts.all },
        { value: "paid", label: "Paid", count: counts.paid },
        { value: "unpaid", label: "Unpaid", count: counts.unpaid },
        { value: "delivered", label: "Delivered", count: counts.delivered },
        { value: "processing", label: "Processing", count: counts.processing },
    ];

    const handleSelectAll = () => {
        if (selectedOrders.length === orders.length) {
            setSelectedOrders([]);
        } else {
            setSelectedOrders(orders.map((o: any) => o.id));
        }
    };

    const handleSelect = (id: string) => {
        setSelectedOrders(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    // Export columns
    const exportColumns = [
        { key: "id", header: "Order ID" },
        { key: "createdAt", header: "Date" },
        { key: "user.name", header: "Customer" },
        { key: "user.email", header: "Email" },
        { key: "totalPrice", header: "Total" },
        { key: "isPaid", header: "Paid" },
        { key: "status", header: "Status" },
        { key: "isDelivered", header: "Delivered" },
    ];

    if (isLoading) {
        return (
            <div className="p-10 text-white">
                <Loader2 className="animate-spin h-8 w-8 text-red-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold">Order History</h1>
                <ExportButton data={orders} filename="orders" columns={exportColumns} />
            </div>

            {/* Filters */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <SearchInput
                        placeholder="Search by Order ID..."
                        value={search}
                        onChange={(v) => { setSearch(v); setPage(1); }}
                        className="md:w-80"
                    />
                    <DateRangePicker
                        startDate={startDate}
                        endDate={endDate}
                        onStartDateChange={(d) => { setStartDate(d); setPage(1); }}
                        onEndDateChange={(d) => { setEndDate(d); setPage(1); }}
                    />
                </div>

                {/* Status Tabs */}
                <FilterTabs
                    tabs={tabs.map(t => ({
                        value: t.value === "paid" || t.value === "unpaid" ? t.value :
                            t.value === "delivered" || t.value === "processing" ? t.value : t.value,
                        label: t.label,
                        count: t.count
                    }))}
                    activeTab={paymentFilter || deliveryFilter}
                    onTabChange={(v) => {
                        if (v === "paid" || v === "unpaid") {
                            setPaymentFilter(v);
                            setDeliveryFilter("");
                        } else if (v === "delivered" || v === "processing") {
                            setDeliveryFilter(v);
                            setPaymentFilter("");
                        } else {
                            setPaymentFilter("");
                            setDeliveryFilter("");
                        }
                        setPage(1);
                    }}
                />
            </div>

            {/* Bulk Actions */}
            {selectedOrders.length > 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center gap-4">
                    <span className="text-sm text-gray-400">{selectedOrders.length} selected</span>
                    <button
                        onClick={() => bulkUpdateMutation.mutate({ orderIds: selectedOrders, updates: { isPaid: true } })}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition"
                    >
                        Mark Paid
                    </button>
                    <button
                        onClick={() => bulkUpdateMutation.mutate({ orderIds: selectedOrders, updates: { isDelivered: true } })}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition"
                    >
                        Mark Delivered
                    </button>
                    <button
                        onClick={() => setSelectedOrders([])}
                        className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded transition"
                    >
                        Clear
                    </button>
                </div>
            )}

            {/* Orders Table */}
            <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-gray-400">
                        <thead className="bg-black text-xs uppercase font-bold text-gray-500">
                            <tr>
                                <th className="p-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedOrders.length === orders.length && orders.length > 0}
                                        onChange={handleSelectAll}
                                        className="rounded bg-zinc-800 border-zinc-700"
                                    />
                                </th>
                                <th className="p-4">Order ID</th>
                                <th className="p-4">Date</th>
                                <th className="p-4">Customer</th>
                                <th className="p-4">Total</th>
                                <th className="p-4">Payment</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {orders.map((order: any) => (
                                <tr key={order.id} className="hover:bg-zinc-800/50 transition">
                                    <td className="p-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedOrders.includes(order.id)}
                                            onChange={() => handleSelect(order.id)}
                                            className="rounded bg-zinc-800 border-zinc-700"
                                        />
                                    </td>
                                    <td className="p-4 font-mono text-xs text-white">{order.id.substring(0, 8)}...</td>
                                    <td className="p-4 text-sm">{dayjs(order.createdAt).format("DD MMM YYYY")}</td>
                                    <td className="p-4 text-white">
                                        {order.shippingAddress?.fullName || "Guest"}
                                        <div className="text-xs text-gray-500">{order.user?.email}</div>
                                    </td>
                                    <td className="p-4 font-bold text-white">₹{order.totalPrice.toLocaleString()}</td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => updateStatusMutation.mutate({
                                                orderId: order.id,
                                                updates: { isPaid: !order.isPaid }
                                            })}
                                            className="hover:opacity-80 transition"
                                        >
                                            {order.isPaid ? (
                                                <StatusBadge status="Paid" />
                                            ) : (
                                                <StatusBadge status="Unpaid" />
                                            )}
                                        </button>
                                    </td>
                                    <td className="p-4">
                                        <select
                                            value={order.status}
                                            onChange={(e) => updateStatusMutation.mutate({
                                                orderId: order.id,
                                                updates: { status: e.target.value }
                                            })}
                                            className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-white focus:border-red-600 focus:outline-none"
                                        >
                                            {ORDER_STATUSES.map(status => (
                                                <option key={status} value={status}>{status}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => updateStatusMutation.mutate({
                                                orderId: order.id,
                                                updates: { isDelivered: !order.isDelivered }
                                            })}
                                            className={`p-2 rounded transition ${order.isDelivered
                                                    ? "bg-green-900/20 text-green-500"
                                                    : "bg-zinc-800 text-gray-400 hover:text-white"
                                                }`}
                                            title={order.isDelivered ? "Mark as Not Delivered" : "Mark as Delivered"}
                                        >
                                            {order.isDelivered ? <CheckCircle size={18} /> : <Truck size={18} />}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-gray-500">No orders found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
            />
        </div>
    );
}
