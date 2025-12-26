"use client";

import { useState, useEffect } from "react";
import { Ticket, Plus, Trash2, ToggleLeft, ToggleRight, Loader2, Percent, DollarSign } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

interface Coupon {
    id: string;
    code: string;
    discountType: string;
    discountValue: number;
    minOrderAmount: number;
    maxUses: number | null;
    usedCount: number;
    isActive: boolean;
    expiresAt: string | null;
    createdAt: string;
}

export default function CouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [code, setCode] = useState("");
    const [discountType, setDiscountType] = useState("percentage");
    const [discountValue, setDiscountValue] = useState("");
    const [minOrderAmount, setMinOrderAmount] = useState("");
    const [maxUses, setMaxUses] = useState("");
    const [expiresAt, setExpiresAt] = useState("");

    const fetchCoupons = async () => {
        try {
            // Cookie handled automatically
            const { data } = await axios.get("/api/coupons");
            setCoupons(data);
        } catch (error) {
            toast.error("Failed to fetch coupons");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code || !discountValue) {
            toast.error("Code and discount value are required");
            return;
        }

        setSaving(true);
        try {
            const userInfo = localStorage.getItem("adminUserInfo");
            const token = userInfo ? JSON.parse(userInfo).token : null;
            await axios.post("/api/coupons", {
                code,
                discountType,
                discountValue,
                minOrderAmount,
                maxUses,
                expiresAt: expiresAt || null
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success("Coupon created!");
            setShowForm(false);
            resetForm();
            fetchCoupons();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to create coupon");
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async (id: string, currentStatus: boolean) => {
        try {
            const userInfo = localStorage.getItem("adminUserInfo");
            const token = userInfo ? JSON.parse(userInfo).token : null;
            await axios.patch("/api/coupons", {
                id,
                isActive: !currentStatus
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setCoupons(prev => prev.map(c =>
                c.id === id ? { ...c, isActive: !currentStatus } : c
            ));
            toast.success(currentStatus ? "Coupon deactivated" : "Coupon activated");
        } catch (error) {
            toast.error("Failed to update coupon");
        }
    };

    const deleteCoupon = async (id: string) => {
        if (!confirm("Delete this coupon?")) return;

        try {
            const userInfo = localStorage.getItem("adminUserInfo");
            const token = userInfo ? JSON.parse(userInfo).token : null;
            await axios.delete(`/api/coupons?id=${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setCoupons(prev => prev.filter(c => c.id !== id));
            toast.success("Coupon deleted");
        } catch (error) {
            toast.error("Failed to delete coupon");
        }
    };

    const resetForm = () => {
        setCode("");
        setDiscountType("percentage");
        setDiscountValue("");
        setMinOrderAmount("");
        setMaxUses("");
        setExpiresAt("");
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                        <Ticket className="text-green-400" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Coupons</h1>
                        <p className="text-gray-400 text-sm">{coupons.length} coupon{coupons.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>

                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    <Plus size={18} />
                    New Coupon
                </button>
            </div>

            {/* Create Form */}
            {showForm && (
                <form onSubmit={handleCreate} className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8">
                    <h3 className="font-bold text-white mb-4">Create New Coupon</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Coupon Code *</label>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                placeholder="SAVE20"
                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Discount Type</label>
                            <select
                                value={discountType}
                                onChange={(e) => setDiscountType(e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                            >
                                <option value="percentage">Percentage (%)</option>
                                <option value="fixed">Fixed Amount (₹)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">
                                Discount Value * {discountType === "percentage" ? "(%)" : "(₹)"}
                            </label>
                            <input
                                type="number"
                                value={discountValue}
                                onChange={(e) => setDiscountValue(e.target.value)}
                                placeholder={discountType === "percentage" ? "10" : "100"}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Min Order Amount (₹)</label>
                            <input
                                type="number"
                                value={minOrderAmount}
                                onChange={(e) => setMinOrderAmount(e.target.value)}
                                placeholder="500"
                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Max Uses (leave empty for unlimited)</label>
                            <input
                                type="number"
                                value={maxUses}
                                onChange={(e) => setMaxUses(e.target.value)}
                                placeholder="100"
                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Expires At</label>
                            <input
                                type="datetime-local"
                                value={expiresAt}
                                onChange={(e) => setExpiresAt(e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-medium transition-colors disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="animate-spin" size={18} /> : "Create Coupon"}
                        </button>
                        <button
                            type="button"
                            onClick={() => { setShowForm(false); resetForm(); }}
                            className="bg-zinc-700 hover:bg-zinc-600 text-white px-6 py-2 rounded font-medium transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {/* Coupons List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-green-500" size={32} />
                </div>
            ) : coupons.length === 0 ? (
                <div className="text-center py-20 bg-zinc-900 border border-zinc-800 rounded-lg">
                    <Ticket size={48} className="mx-auto mb-4 text-gray-600" />
                    <h2 className="text-xl font-bold text-white mb-2">No Coupons</h2>
                    <p className="text-gray-400">Create your first coupon to offer discounts</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {coupons.map((coupon) => (
                        <div
                            key={coupon.id}
                            className={`bg-zinc-900 border rounded-lg p-5 flex flex-col md:flex-row md:items-center gap-4 transition-colors ${coupon.isActive ? "border-zinc-800" : "border-red-900/50 opacity-60"
                                }`}
                        >
                            {/* Code */}
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xl font-mono font-bold text-green-400">{coupon.code}</span>
                                    {!coupon.isActive && (
                                        <span className="text-xs bg-red-600/20 text-red-400 px-2 py-0.5 rounded">Inactive</span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-400">
                                    {coupon.discountType === "percentage" ? (
                                        <span className="flex items-center gap-1"><Percent size={14} />{coupon.discountValue}% off</span>
                                    ) : (
                                        <span className="flex items-center gap-1">₹{coupon.discountValue} off</span>
                                    )}
                                </p>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-6 text-sm text-gray-400">
                                <div>
                                    <p className="text-xs text-gray-500">Min Order</p>
                                    <p className="text-white">₹{coupon.minOrderAmount}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Used</p>
                                    <p className="text-white">{coupon.usedCount}/{coupon.maxUses || "∞"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Expires</p>
                                    <p className="text-white">
                                        {coupon.expiresAt
                                            ? new Date(coupon.expiresAt).toLocaleDateString()
                                            : "Never"
                                        }
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => toggleActive(coupon.id, coupon.isActive)}
                                    className={`p-2 rounded transition-colors ${coupon.isActive
                                        ? "bg-green-600/20 text-green-400 hover:bg-green-600/30"
                                        : "bg-zinc-700 text-gray-400 hover:bg-zinc-600"
                                        }`}
                                    title={coupon.isActive ? "Deactivate" : "Activate"}
                                >
                                    {coupon.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                </button>
                                <button
                                    onClick={() => deleteCoupon(coupon.id)}
                                    className="p-2 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
