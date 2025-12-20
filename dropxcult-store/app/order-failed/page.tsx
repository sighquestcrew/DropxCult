"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { XCircle, RefreshCw, Home, MessageCircle } from "lucide-react";
import { Suspense } from "react";

function OrderFailedContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get("orderId");
    const reason = searchParams.get("reason");

    const getErrorMessage = (code: string | null) => {
        switch (code) {
            case "BAD_REQUEST_ERROR":
                return "There was an issue with the payment request.";
            case "GATEWAY_ERROR":
                return "Payment gateway is temporarily unavailable.";
            case "SERVER_ERROR":
                return "Server error occurred during payment.";
            default:
                return "Your payment could not be processed.";
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                {/* Failed Icon */}
                <div className="mb-8">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                        <XCircle size={48} className="text-white" />
                    </div>
                </div>

                {/* Failed Message */}
                <h1 className="text-3xl font-black mb-2">PAYMENT FAILED</h1>
                <p className="text-gray-400 mb-6">
                    {getErrorMessage(reason)}
                </p>

                {/* Error Details */}
                {(orderId || reason) && (
                    <div className="bg-zinc-900 border border-red-900/50 rounded-lg p-4 mb-8 text-left">
                        {orderId && (
                            <div className="mb-2">
                                <span className="text-gray-500 text-sm">Order ID: </span>
                                <span className="font-mono text-sm">{orderId}</span>
                            </div>
                        )}
                        {reason && (
                            <div>
                                <span className="text-gray-500 text-sm">Error Code: </span>
                                <span className="font-mono text-sm text-red-400">{reason}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* What You Can Do */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 mb-8 text-left">
                    <h3 className="font-semibold mb-3 text-sm text-gray-400">WHAT YOU CAN DO</h3>
                    <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                            <span className="text-yellow-500 mt-0.5">•</span>
                            <span>Check your payment details and try again</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-yellow-500 mt-0.5">•</span>
                            <span>Try a different payment method</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-yellow-500 mt-0.5">•</span>
                            <span>Contact your bank if the issue persists</span>
                        </li>
                    </ul>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <Link
                        href="/checkout"
                        className="w-full bg-red-600 text-white font-bold h-12 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={18} />
                        Try Again
                    </Link>
                    <Link
                        href="/"
                        className="w-full bg-zinc-800 text-white font-semibold h-12 rounded-lg hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <Home size={18} />
                        Back to Home
                    </Link>
                </div>

                {/* Support Link */}
                <div className="mt-8 pt-6 border-t border-zinc-800">
                    <p className="text-gray-500 text-sm mb-3">Need help?</p>
                    <a
                        href="mailto:support@dropxcult.com"
                        className="text-red-500 hover:text-red-400 text-sm flex items-center justify-center gap-2"
                    >
                        <MessageCircle size={16} />
                        Contact Support
                    </a>
                </div>
            </div>
        </div>
    );
}

export default function OrderFailedPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full" />
            </div>
        }>
            <OrderFailedContent />
        </Suspense>
    );
}
