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

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (orderId: string) => {
            await axios.delete(`/api/orders/${orderId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
            toast.success("Order deleted successfully");
        },
        onError: () => {
            toast.error("Failed to delete order");
        }
    });

    const [viewOrder, setViewOrder] = useState<any | null>(null);

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
        <div className="space-y-6 relative" >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold">Order History</h1>
                <ExportButton data={orders} filename="orders" columns={exportColumns} />
            </div>

            {/* Filters */}
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full md:w-auto">
                        <label className="text-xs text-gray-500 mb-1.5 block font-medium uppercase tracking-wider">Search</label>
                        <SearchInput
                            placeholder="Search Order ID, Name, Email..."
                            value={search}
                            onChange={(v) => { setSearch(v); setPage(1); }}
                            className="w-full bg-black border-zinc-700 focus:border-red-500 h-10"
                        />
                    </div>
                    <div className="w-full md:w-auto">
                        <DateRangePicker
                            startDate={startDate}
                            endDate={endDate}
                            onStartDateChange={(d) => { setStartDate(d); setPage(1); }}
                            onEndDateChange={(d) => { setEndDate(d); setPage(1); }}
                        />
                    </div>
                </div>

                {/* Status Tabs */}
                <FilterTabs
                    tabs={
                        tabs.map(t => ({
                            value: t.value === "paid" || t.value === "unpaid" ? t.value :
                                t.value === "delivered" || t.value === "processing" ? t.value : t.value,
                            label: t.label,
                            count: t.count
                        }))
                    }
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
                    }
                    }
                />
            </div >

            {/* Bulk Actions */}
            {
                selectedOrders.length > 0 && (
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
                )
            }

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
                                    <td className="p-4 flex gap-2">
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
                                            {order.isDelivered ? <CheckCircle size={16} /> : <Truck size={16} />}
                                        </button>
                                        <button
                                            onClick={() => setViewOrder(order)}
                                            className="p-2 rounded bg-zinc-800 text-blue-400 hover:text-blue-300 hover:bg-zinc-700 transition"
                                            title="View Details"
                                        >
                                            <Package size={16} /> {/* Using Package or Eye */}
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm("Are you sure you want to delete this order? This cannot be undone.")) {
                                                    deleteMutation.mutate(order.id);
                                                }
                                            }}
                                            className="p-2 rounded bg-zinc-800 text-red-500 hover:text-red-400 hover:bg-zinc-700 transition"
                                            title="Delete Order"
                                        >
                                            <XCircle size={16} />
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

            {/* Order Details Modal */}
            {
                viewOrder && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setViewOrder(null)}>
                        <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden" onClick={e => e.stopPropagation()}>
                            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900 sticky top-0">
                                <h2 className="text-xl font-bold">Order Details</h2>
                                <button onClick={() => setViewOrder(null)} className="text-gray-500 hover:text-white">✕</button>
                            </div>
                            <div className="p-6 space-y-6">
                                {/* Header Info */}
                                <div className="flex flex-wrap gap-4 justify-between bg-black/30 p-4 rounded-lg">
                                    <div>
                                        <p className="text-sm text-gray-500">Order ID</p>
                                        <p className="font-mono font-bold text-white">{viewOrder.id}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Date</p>
                                        <p className="text-white">{dayjs(viewOrder.createdAt).format("DD MMM YYYY, hh:mm A")}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Total</p>
                                        <p className="font-bold text-green-500">₹{viewOrder.totalPrice}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Status</p>
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${viewOrder.isPaid ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                            {viewOrder.isPaid ? 'PAID' : 'UNPAID'}
                                        </span>
                                    </div>
                                </div>

                                {/* Two Col Layout */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* User & Shipping */}
                                    <div className="space-y-4">
                                        <h3 className="font-bold border-b border-zinc-800 pb-2">Customer & Shipping</h3>
                                        <div>
                                            <p className="text-sm text-gray-400">Name</p>
                                            <p className="font-medium">{viewOrder.shippingAddress?.fullName || viewOrder.user?.name || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-400">Email</p>
                                            <p className="font-medium">{viewOrder.shippingAddress?.email || viewOrder.user?.email || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-400">Phone</p>
                                            <p className="font-medium">{viewOrder.shippingAddress?.phone || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-400">Address</p>
                                            <p className="font-medium">
                                                {viewOrder.shippingAddress?.address}<br />
                                                {viewOrder.shippingAddress?.city}, {viewOrder.shippingAddress?.state} - {viewOrder.shippingAddress?.postalCode}<br />
                                                {viewOrder.shippingAddress?.country}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Payment & Delivery */}
                                    <div className="space-y-4">
                                        <h3 className="font-bold border-b border-zinc-800 pb-2">Payment & Status</h3>
                                        <div>
                                            <p className="text-sm text-gray-400">Payment Method</p>
                                            <p className="font-medium capitalize">{viewOrder.paymentMethod || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-400">Payment ID</p>
                                            <p className="font-mono text-xs">{viewOrder.paymentResult?.id || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-400">Current Status</p>
                                            <p className="font-medium">{viewOrder.status}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div>
                                    <h3 className="font-bold border-b border-zinc-800 pb-2 mb-4">Order Items</h3>
                                    <div className="space-y-3">
                                        {viewOrder.orderItems?.map((item: any, i: number) => {
                                            console.log("Debug OrderItem:", { name: item.name, designId: item.designId, slug: item.product?.slug, isCustom: item.isCustom });
                                            return (
                                                <div key={i} className="flex gap-4 items-center bg-zinc-800/50 p-3 rounded-lg">
                                                    <div className="h-16 w-16 bg-black rounded overflow-hidden flex-shrink-0">
                                                        {item.image ? (
                                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-600"><Package size={20} /></div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-white">{item.name}</p>
                                                        <div className="flex flex-wrap gap-2 text-xs text-gray-400 mt-1">
                                                            <span>Size: {item.size}</span>
                                                            <span>|</span>
                                                            <span>Qty: {item.qty}</span>
                                                            {item.product?.category && (
                                                                <>
                                                                    <span>|</span>
                                                                    <span className="text-purple-400">{item.product.category}</span>
                                                                </>
                                                            )}
                                                            {item.product?.garmentType && (
                                                                <>
                                                                    <span>|</span>
                                                                    <span className="text-yellow-500">{item.product.garmentType}</span>
                                                                </>
                                                            )}
                                                        </div>

                                                        <div className="flex gap-2 mt-2">
                                                            {/* Show 3D View Link for Designs or 3D Products */}
                                                            {(item.designId || item.product?.slug?.startsWith('design-')) && (
                                                                <a
                                                                    href={`http://localhost:3001/product/${item.designId ? `design-${item.designId}` : item.product?.slug}?view=admin`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300 transition"
                                                                >
                                                                    <Package size={12} />
                                                                    View 3D Design
                                                                </a>
                                                            )}
                                                            {item.productId && <span className="text-xs text-zinc-600">ID: {item.productId.slice(-6)}</span>}
                                                        </div>
                                                    </div>
                                                    <p className="font-bold">₹{item.price * item.qty}</p>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                            </div>
                            <div className="p-4 border-t border-zinc-800 bg-zinc-900 sticky bottom-0 flex justify-end">
                                <button
                                    onClick={() => setViewOrder(null)}
                                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded transition"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
