"use client";

import { useState } from "react";
import { X, DollarSign, Info, CheckCircle2 } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface WithdrawModalProps {
    isOpen: boolean;
    onClose: () => void;
    availableBalance: number;
    userToken: string;
}

export default function WithdrawModal({ isOpen, onClose, availableBalance, userToken }: WithdrawModalProps) {
    const queryClient = useQueryClient();
    const [amount, setAmount] = useState("");
    const [bankDetails, setBankDetails] = useState({
        accountName: "",
        accountNumber: "",
        ifscCode: "",
        bankName: "",
        upiId: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        console.log("[WITHDRAW] Form submitted", { amount, bankDetails, userToken: userToken ? "Present" : "Missing" });

        if (parseFloat(amount) < 500) {
            toast.error("Minimum withdrawal amount is ₹500");
            return;
        }

        if (parseFloat(amount) > availableBalance) {
            toast.error(`Insufficient balance. Available: ₹${availableBalance}`);
            return;
        }

        setIsSubmitting(true);
        console.log("[WITHDRAW] Validation passed, sending request...");

        try {
            const { data } = await axios.post(
                "/api/user/withdraw",
                {
                    amount: parseFloat(amount),
                    ...bankDetails
                },
                {
                    headers: { Authorization: `Bearer ${userToken}` }
                }
            );

            console.log("[WITHDRAW] Success response:", data);
            toast.success("Withdrawal request submitted successfully!");
            queryClient.invalidateQueries({ queryKey: ["user-profile"] });
            queryClient.invalidateQueries({ queryKey: ["withdrawal-requests"] });
            onClose();

            // Reset form
            setAmount("");
            setBankDetails({
                accountName: "",
                accountNumber: "",
                ifscCode: "",
                bankName: "",
                upiId: ""
            });
        } catch (error: any) {
            console.error("[WITHDRAW] Error:", error);
            const errorMsg = error.response?.data?.error || "Failed to submit request";
            toast.error(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                    <X size={24} />
                </button>

                <div className="mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <DollarSign className="text-green-500" />
                        Withdraw Royalty Earnings
                    </h2>
                    <p className="text-gray-400 text-sm mt-2">
                        Available Balance: <span className="text-green-500 font-bold">₹{availableBalance}</span>
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            Withdrawal Amount *
                        </label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Enter amount (min ₹500)"
                            required
                            min="500"
                            max={availableBalance}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Minimum: ₹500 | Maximum: ₹{availableBalance}</p>
                    </div>

                    <div className="border-t border-zinc-800 pt-4">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <Info size={16} className="text-blue-500" />
                            Bank Account Details
                        </h3>

                        {/* Account Holder Name */}
                        <div className="mb-3">
                            <label className="block text-sm font-medium mb-1">Account Holder Name *</label>
                            <input
                                type="text"
                                value={bankDetails.accountName}
                                onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
                                placeholder="As per bank records"
                                required
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        {/* Account Number */}
                        <div className="mb-3">
                            <label className="block text-sm font-medium mb-1">Account Number *</label>
                            <input
                                type="text"
                                value={bankDetails.accountNumber}
                                onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                                placeholder="Enter account number"
                                required
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        {/* IFSC Code */}
                        <div className="mb-3">
                            <label className="block text-sm font-medium mb-1">IFSC Code *</label>
                            <input
                                type="text"
                                value={bankDetails.ifscCode}
                                onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value.toUpperCase() })}
                                placeholder="e.g., SBIN0001234"
                                required
                                pattern="[A-Z]{4}0[A-Z0-9]{6}"
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 uppercase"
                            />
                            <p className="text-xs text-gray-500 mt-1">11-character bank code</p>
                        </div>

                        {/* Bank Name */}
                        <div className="mb-3">
                            <label className="block text-sm font-medium mb-1">Bank Name *</label>
                            <input
                                type="text"
                                value={bankDetails.bankName}
                                onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                                placeholder="e.g., State Bank of India"
                                required
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        {/* UPI ID (Optional) */}
                        <div>
                            <label className="block text-sm font-medium mb-1">UPI ID (Optional)</label>
                            <input
                                type="text"
                                value={bankDetails.upiId}
                                onChange={(e) => setBankDetails({ ...bankDetails, upiId: e.target.value })}
                                placeholder="yourname@upi"
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-sm">
                        <p className="flex items-start gap-2">
                            <CheckCircle2 size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-300">
                                Your request will be reviewed by our team. Once approved, the amount will be transferred to your account within 3-5 business days.
                            </span>
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-3 rounded-xl hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? "Submitting..." : "Submit Withdrawal Request"}
                    </button>
                </form>
            </div>
        </div>
    );
}
