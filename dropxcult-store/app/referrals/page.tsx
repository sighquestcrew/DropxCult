"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Copy, Gift, Users, Share2, CheckCircle, Clock, Loader2 } from "lucide-react";
import Link from "next/link";

interface ReferralData {
    referralCode: string;
    referralLink: string;
    credits: number;
    totalReferrals: number;
    successfulReferrals: number;
    referrals: {
        refereeName: string;
        status: string;
        reward: number;
        date: string;
    }[];
}

export default function ReferralsPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<ReferralData | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const userInfo = localStorage.getItem("storeUserInfo");
        if (userInfo) {
            setIsLoggedIn(true);
            fetchReferralData(JSON.parse(userInfo).token);
        } else {
            setLoading(false);
        }
    }, []);

    const fetchReferralData = async (token: string) => {
        try {
            const { data } = await axios.get("/api/referrals", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(data);
        } catch (error) {
            console.error("Failed to fetch referral data");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
    };

    const shareLink = () => {
        if (navigator.share && data) {
            navigator.share({
                title: "Join DropXCult",
                text: `Use my referral code ${data.referralCode} and we both get ₹100!`,
                url: data.referralLink
            });
        } else if (data) {
            copyToClipboard(data.referralLink);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="animate-spin text-red-500" size={32} />
            </div>
        );
    }

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
                <Gift className="text-red-500 mb-4" size={64} />
                <h1 className="text-2xl font-bold mb-2">Earn ₹100 Per Referral!</h1>
                <p className="text-gray-400 mb-6 text-center">
                    Login to get your unique referral link and earn credits.
                </p>
                <Link
                    href="/login"
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium"
                >
                    Login to Continue
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <div className="max-w-4xl mx-auto px-4 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600/20 rounded-full mb-4">
                        <Gift className="text-red-500" size={32} />
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Refer & Earn</h1>
                    <p className="text-gray-400">Share with friends and both of you get ₹100 credit!</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
                        <p className="text-gray-500 text-sm mb-1">Your Credits</p>
                        <p className="text-3xl font-bold text-green-500">₹{data?.credits || 0}</p>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
                        <p className="text-gray-500 text-sm mb-1">Total Referrals</p>
                        <p className="text-3xl font-bold">{data?.totalReferrals || 0}</p>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
                        <p className="text-gray-500 text-sm mb-1">Successful</p>
                        <p className="text-3xl font-bold text-purple-500">{data?.successfulReferrals || 0}</p>
                    </div>
                </div>

                {/* Referral Code */}
                <div className="bg-gradient-to-r from-red-900/30 to-purple-900/30 border border-red-800/50 rounded-xl p-6 mb-8">
                    <p className="text-sm text-gray-400 mb-2">Your Referral Code</p>
                    <div className="flex items-center gap-4 mb-4">
                        <code className="text-2xl font-mono font-bold tracking-wider">{data?.referralCode}</code>
                        <button
                            onClick={() => copyToClipboard(data?.referralCode || "")}
                            className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition"
                        >
                            <Copy size={18} />
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => copyToClipboard(data?.referralLink || "")}
                            className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-4 py-3 rounded-lg transition"
                        >
                            <Copy size={16} /> Copy Link
                        </button>
                        <button
                            onClick={shareLink}
                            className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-3 rounded-lg transition"
                        >
                            <Share2 size={16} /> Share
                        </button>
                    </div>
                </div>

                {/* How it works */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
                    <h2 className="font-bold mb-4 flex items-center gap-2">
                        <Users size={18} /> How it Works
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4">
                            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-2 font-bold">1</div>
                            <p className="text-sm text-gray-400">Share your code</p>
                        </div>
                        <div className="text-center p-4">
                            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-2 font-bold">2</div>
                            <p className="text-sm text-gray-400">Friend signs up & orders</p>
                        </div>
                        <div className="text-center p-4">
                            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-2 font-bold">3</div>
                            <p className="text-sm text-gray-400">Both get ₹100 credit!</p>
                        </div>
                    </div>
                </div>

                {/* Referral History */}
                {data?.referrals && data.referrals.length > 0 && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                        <h2 className="font-bold mb-4">Your Referrals</h2>
                        <div className="space-y-3">
                            {data.referrals.map((referral, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                                    <div>
                                        <p className="font-medium">{referral.refereeName}</p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(referral.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {referral.status === "credited" ? (
                                            <span className="flex items-center gap-1 text-green-500 text-sm">
                                                <CheckCircle size={14} /> +₹{referral.reward}
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-yellow-500 text-sm">
                                                <Clock size={14} /> Pending
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
