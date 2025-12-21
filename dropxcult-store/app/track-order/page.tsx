"use client";

import { useState } from "react";
import { Package, Search, Truck, CheckCircle, Clock, MapPin, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";

// Order status steps
const ORDER_STEPS = [
    { key: "placed", label: "Order Placed", icon: Package, description: "Your order has been received" },
    { key: "confirmed", label: "Confirmed", icon: CheckCircle, description: "Order confirmed & payment verified" },
    { key: "printing", label: "Printing", icon: Clock, description: "Your custom design is being printed" },
    { key: "shipped", label: "Shipped", icon: Truck, description: "On the way to you" },
    { key: "delivered", label: "Delivered", icon: MapPin, description: "Delivered successfully" },
];

// Map order status from DB to step index
const getStepIndex = (status: string, isPaid: boolean, isDelivered: boolean) => {
    if (isDelivered) return 4; // Delivered
    if (status === "Shipped") return 3;
    if (status === "Processing" || status === "Printing") return 2;
    if (isPaid) return 1; // Confirmed
    return 0; // Placed
};

export default function TrackOrderPage() {
    const [orderId, setOrderId] = useState("");
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orderId.trim()) {
            toast.error("Please enter an order ID");
            return;
        }

        setLoading(true);
        setError("");
        setOrder(null);

        try {
            const { data } = await axios.get(`/api/orders/${orderId.trim()}`);
            setOrder(data);
        } catch (err: any) {
            setError(err.response?.data?.error || "Order not found");
            toast.error("Order not found");
        } finally {
            setLoading(false);
        }
    };

    const currentStep = order ? getStepIndex(order.status || "Placed", order.isPaid, order.isDelivered) : 0;

    return (
        <div className="min-h-screen bg-black text-white py-12">
            <div className="container mx-auto px-4 max-w-3xl">
                {/* Back Link */}
                <Link href="/" className="flex items-center text-gray-400 hover:text-white mb-8 transition-colors">
                    <ArrowLeft size={18} className="mr-2" />
                    Back to Home
                </Link>

                {/* Header */}
                <div className="text-center mb-12">
                    <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Package className="text-blue-500" size={32} />
                    </div>
                    <h1 className="text-4xl font-bold mb-4">Track Your Order</h1>
                    <p className="text-gray-400">
                        Enter your order ID to see the current status
                    </p>
                </div>

                {/* Search Form */}
                <form onSubmit={handleTrack} className="mb-12">
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                value={orderId}
                                onChange={(e) => setOrderId(e.target.value)}
                                placeholder="Enter Order ID (e.g. CMJF9HG3...)"
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-12 pr-4 py-4 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition-colors"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                            Track
                        </button>
                    </div>
                </form>

                {/* Error State */}
                {error && (
                    <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-lg">
                        <Package size={48} className="mx-auto mb-4 text-gray-600" />
                        <p className="text-gray-400 mb-2">{error}</p>
                        <p className="text-sm text-gray-500">Please check your order ID and try again</p>
                    </div>
                )}

                {/* Order Found */}
                {order && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                        {/* Order Header */}
                        <div className="p-6 border-b border-zinc-800 bg-gradient-to-r from-blue-600/10 to-purple-600/10">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm text-gray-400">Order ID</p>
                                    <p className="text-xl font-bold font-mono">
                                        #{order.id.substring(0, 8).toUpperCase()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-400">Total Amount</p>
                                    <p className="text-xl font-bold text-green-500">₹{order.totalPrice}</p>
                                </div>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="p-6">
                            <h3 className="font-bold mb-6">Order Status</h3>
                            <div className="relative">
                                {ORDER_STEPS.map((step, index) => {
                                    const Icon = step.icon;
                                    const isCompleted = index <= currentStep;
                                    const isCurrent = index === currentStep;

                                    return (
                                        <div key={step.key} className="flex gap-4 pb-8 last:pb-0">
                                            {/* Line */}
                                            <div className="flex flex-col items-center">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isCompleted
                                                        ? isCurrent
                                                            ? 'bg-blue-600 ring-4 ring-blue-600/30'
                                                            : 'bg-green-600'
                                                        : 'bg-zinc-800 border border-zinc-700'
                                                    }`}>
                                                    <Icon size={20} className={isCompleted ? 'text-white' : 'text-gray-500'} />
                                                </div>
                                                {index < ORDER_STEPS.length - 1 && (
                                                    <div className={`w-0.5 flex-1 min-h-[40px] ${index < currentStep ? 'bg-green-600' : 'bg-zinc-700'
                                                        }`} />
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="pt-2">
                                                <p className={`font-semibold ${isCompleted ? 'text-white' : 'text-gray-500'}`}>
                                                    {step.label}
                                                    {isCurrent && (
                                                        <span className="ml-2 text-xs bg-blue-600 px-2 py-0.5 rounded-full">Current</span>
                                                    )}
                                                </p>
                                                <p className="text-sm text-gray-500">{step.description}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="p-6 border-t border-zinc-800">
                            <h3 className="font-bold mb-4">Order Items</h3>
                            <div className="space-y-3">
                                {order.orderItems?.map((item: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-4 bg-zinc-800/50 rounded-lg p-3">
                                        {item.image && (
                                            <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                                        )}
                                        <div className="flex-1">
                                            <p className="font-medium">{item.name}</p>
                                            <p className="text-sm text-gray-400">
                                                Size: {item.size} | Qty: {item.qty}
                                            </p>
                                        </div>
                                        <p className="font-bold">₹{item.price}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Shipping Address */}
                        {order.shippingAddress && (
                            <div className="p-6 border-t border-zinc-800">
                                <h3 className="font-bold mb-3">Shipping Address</h3>
                                <p className="text-gray-400 text-sm">
                                    {order.shippingAddress.fullName}<br />
                                    {order.shippingAddress.address}<br />
                                    {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}<br />
                                    Phone: {order.shippingAddress.phone}
                                </p>
                            </div>
                        )}

                        {/* Tracking ID if shipped */}
                        {order.trackingId && (
                            <div className="p-6 border-t border-zinc-800 bg-blue-600/10">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-400">Tracking ID</p>
                                        <p className="font-bold font-mono">{order.trackingId}</p>
                                    </div>
                                    {order.trackingUrl && (
                                        <a
                                            href={order.trackingUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-bold text-sm transition-colors"
                                        >
                                            Track Package
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Help Section */}
                <div className="mt-12 text-center">
                    <p className="text-gray-500 text-sm">
                        Can't find your order? Contact us at{" "}
                        <a href="mailto:support@dropxcult.com" className="text-blue-500 hover:underline">
                            support@dropxcult.com
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
