"use client";

import { useState, useEffect } from "react";
import { Clock, TrendingUp, Truck, AlertTriangle, CheckCircle } from "lucide-react";

interface Campaign {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    minQuantity: number;
    totalQuantity: number;
    progress: number;
    expectedDelivery: string;
    daysRemaining: number;
    deliveryDays: number;
}

interface PreOrderBannerProps {
    productId: string;
    campaign: Campaign | null;
    onPreOrderClick: () => void;
}

export default function PreOrderBanner({ productId, campaign, onPreOrderClick }: PreOrderBannerProps) {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        if (!campaign) return;

        const calculateTimeLeft = () => {
            const endTime = new Date(campaign.endDate).getTime();
            const now = Date.now();
            const diff = endTime - now;

            if (diff <= 0) {
                return { days: 0, hours: 0, minutes: 0, seconds: 0 };
            }

            return {
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((diff % (1000 * 60)) / 1000)
            };
        };

        setTimeLeft(calculateTimeLeft());
        const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
        return () => clearInterval(timer);
    }, [campaign]);

    if (!campaign) return null;

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    return (
        <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-500/30 rounded-xl p-5 mb-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
                    <span className="text-purple-300 font-bold uppercase text-sm tracking-wider">
                        Pre-Order Now
                    </span>
                </div>
                <span className="text-xs text-gray-400">
                    Ends {formatDate(campaign.endDate)}
                </span>
            </div>

            {/* Countdown Timer */}
            <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                    { label: "Days", value: timeLeft.days },
                    { label: "Hours", value: timeLeft.hours },
                    { label: "Mins", value: timeLeft.minutes },
                    { label: "Secs", value: timeLeft.seconds }
                ].map(({ label, value }) => (
                    <div key={label} className="bg-black/30 rounded-lg p-2 text-center">
                        <div className="text-2xl font-bold text-white font-mono">
                            {String(value).padStart(2, '0')}
                        </div>
                        <div className="text-xs text-gray-400">{label}</div>
                    </div>
                ))}
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">
                        {campaign.totalQuantity} / {campaign.minQuantity} orders
                    </span>
                    <span className={campaign.progress >= 100 ? "text-green-400" : "text-purple-400"}>
                        {campaign.progress}%
                    </span>
                </div>
                <div className="h-3 bg-black/30 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-500 ${campaign.progress >= 100
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                : 'bg-gradient-to-r from-purple-500 to-pink-500'
                            }`}
                        style={{ width: `${Math.min(100, campaign.progress)}%` }}
                    />
                </div>
                {campaign.progress < 100 && (
                    <p className="text-xs text-gray-500 mt-1">
                        {campaign.minQuantity - campaign.totalQuantity} more orders needed to start production
                    </p>
                )}
                {campaign.progress >= 100 && (
                    <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                        <CheckCircle size={12} /> Goal reached! Production guaranteed
                    </p>
                )}
            </div>

            {/* Delivery Info */}
            <div className="flex items-center gap-4 p-3 bg-black/20 rounded-lg mb-4">
                <Truck size={20} className="text-purple-400" />
                <div className="flex-1">
                    <p className="text-sm text-white font-medium">
                        Expected Delivery: {formatDate(campaign.expectedDelivery)}
                    </p>
                    <p className="text-xs text-gray-400">
                        (~{campaign.deliveryDays} days after pre-order closes)
                    </p>
                </div>
            </div>

            {/* Trust Elements */}
            <div className="space-y-2 text-xs text-gray-400 mb-4">
                <div className="flex items-start gap-2">
                    <AlertTriangle size={14} className="text-yellow-500 shrink-0 mt-0.5" />
                    <span>Full payment required. Refund if minimum orders not met.</span>
                </div>
                <div className="flex items-start gap-2">
                    <CheckCircle size={14} className="text-green-500 shrink-0 mt-0.5" />
                    <span>Production starts after pre-order window closes.</span>
                </div>
            </div>

            {/* CTA Button */}
            <button
                onClick={onPreOrderClick}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-lg transition-all uppercase tracking-wider flex items-center justify-center gap-2"
            >
                <Clock size={18} />
                Pre-Order Now
            </button>
        </div>
    );
}
