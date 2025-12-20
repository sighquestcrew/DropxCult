"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Package, ArrowRight, Home } from "lucide-react";
import { Suspense } from "react";

function OrderSuccessContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get("orderId");

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                {/* Success Icon with Animation */}
                <div className="mb-8 relative">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center animate-pulse">
                        <CheckCircle size={48} className="text-white" />
                    </div>
                    <div className="absolute inset-0 w-24 h-24 mx-auto bg-green-500/20 rounded-full animate-ping" />
                </div>

                {/* Success Message */}
                <h1 className="text-3xl font-black mb-2">ORDER CONFIRMED!</h1>
                <p className="text-gray-400 mb-6">
                    Thank you for shopping with DropX Cult
                </p>

                {/* Order Details Card */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8">
                    <div className="flex items-center justify-center gap-2 text-gray-400 mb-4">
                        <Package size={20} />
                        <span>Order ID</span>
                    </div>
                    <p className="font-mono text-lg text-white break-all">
                        {orderId || "Loading..."}
                    </p>
                </div>

                {/* What's Next */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 mb-8 text-left">
                    <h3 className="font-semibold mb-3 text-sm text-gray-400">WHAT&apos;S NEXT?</h3>
                    <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">✓</span>
                            <span>You&apos;ll receive an email confirmation shortly</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">✓</span>
                            <span>We&apos;ll notify you when your order ships</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">✓</span>
                            <span>Expected delivery: 3-5 business days</span>
                        </li>
                    </ul>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <Link
                        href="/orders"
                        className="w-full bg-red-600 text-white font-bold h-12 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                        View My Orders
                        <ArrowRight size={18} />
                    </Link>
                    <Link
                        href="/"
                        className="w-full bg-zinc-800 text-white font-semibold h-12 rounded-lg hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <Home size={18} />
                        Continue Shopping
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function OrderSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full" />
            </div>
        }>
            <OrderSuccessContent />
        </Suspense>
    );
}
