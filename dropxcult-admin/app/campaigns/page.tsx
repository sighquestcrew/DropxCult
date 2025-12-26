"use client";

import { useState, useEffect } from "react";
import {
    Calendar, Plus, Package, TrendingUp, Clock, Users,
    ChevronRight, Loader2, Play, Square, Trash2, Download,
    AlertTriangle, CheckCircle, Factory, Truck
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import Link from "next/link";

interface Campaign {
    id: string;
    name: string;
    description: string | null;
    productId: string;
    product: { id: string; name: string; slug: string; images: string[] };
    startDate: string;
    endDate: string;
    minQuantity: number;
    maxQuantity: number | null;
    deliveryDays: number;
    status: string;
    totalOrders: number;
    totalQuantity: number;
    totalRevenue: number;
    createdAt: string;
}

interface Product {
    id: string;
    name: string;
    slug: string;
    price: number;
    images: string[];
}

const STATUS_COLORS: Record<string, string> = {
    draft: "bg-gray-600",
    active: "bg-green-600",
    closed: "bg-blue-600",
    cancelled: "bg-red-600",
    fulfilled: "bg-purple-600"
};

const STATUS_ICONS: Record<string, any> = {
    draft: Clock,
    active: Play,
    closed: CheckCircle,
    cancelled: AlertTriangle,
    fulfilled: Factory
};

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Form state
    const [productId, setProductId] = useState("");
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [minQuantity, setMinQuantity] = useState("50");
    const [maxQuantity, setMaxQuantity] = useState("");
    const [deliveryDays, setDeliveryDays] = useState("25");

    const getToken = () => {
        const userInfo = localStorage.getItem("adminUserInfo");
        return userInfo ? JSON.parse(userInfo).token : null;
    };

    const fetchCampaigns = async () => {
        try {
            const token = getToken();
            const { data } = await axios.get("/api/campaigns", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCampaigns(data);
        } catch (error) {
            toast.error("Failed to fetch campaigns");
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            // Cookie handled automatically
            const { data } = await axios.get("/api/products");
            // Handle both array and object response
            const productList = Array.isArray(data) ? data : (data.products || []);
            setProducts(productList);
        } catch (error) {
            console.error("Failed to fetch products");
            setProducts([]);
        }
    };

    useEffect(() => {
        fetchCampaigns();
        fetchProducts();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productId || !name || !startDate || !endDate) {
            toast.error("Please fill all required fields");
            return;
        }

        setSaving(true);
        try {
            const token = getToken();
            await axios.post("/api/campaigns", {
                productId,
                name,
                description: description || null,
                startDate,
                endDate,
                minQuantity: parseInt(minQuantity),
                maxQuantity: maxQuantity ? parseInt(maxQuantity) : null,
                deliveryDays: parseInt(deliveryDays)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success("Campaign created!");
            setShowForm(false);
            resetForm();
            fetchCampaigns();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to create");
        } finally {
            setSaving(false);
        }
    };

    const handleAction = async (campaignId: string, action: string) => {
        setActionLoading(campaignId);
        try {
            const token = getToken();
            const { data } = await axios.patch("/api/campaigns", {
                id: campaignId,
                action
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success(data.message);
            fetchCampaigns();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Action failed");
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (campaignId: string) => {
        if (!confirm("Delete this draft campaign?")) return;

        try {
            const token = getToken();
            await axios.delete(`/api/campaigns?id=${campaignId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Campaign deleted");
            fetchCampaigns();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Delete failed");
        }
    };

    const resetForm = () => {
        setProductId("");
        setName("");
        setDescription("");
        setStartDate("");
        setEndDate("");
        setMinQuantity("50");
        setMaxQuantity("");
        setDeliveryDays("25");
    };

    const getProgress = (campaign: Campaign) => {
        return Math.min(100, Math.round((campaign.totalQuantity / campaign.minQuantity) * 100));
    };

    const getDaysRemaining = (endDate: string) => {
        const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return Math.max(0, days);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-red-500" size={32} />
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
                        <Calendar className="text-purple-400" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Pre-Order Campaigns</h1>
                        <p className="text-gray-400 text-sm">{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    <Plus size={18} />
                    New Campaign
                </button>
            </div>

            {/* Create Form */}
            {showForm && (
                <form onSubmit={handleCreate} className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8">
                    <h3 className="font-bold text-white mb-4">Create Pre-Order Campaign</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Product *</label>
                            <select
                                value={productId}
                                onChange={(e) => setProductId(e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                            >
                                <option value="">Select product</option>
                                {products.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Campaign Name *</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Cyberpunk Tee Drop #1"
                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Description</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Limited edition drop"
                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Start Date *</label>
                            <input
                                type="datetime-local"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">End Date *</label>
                            <input
                                type="datetime-local"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Min Quantity</label>
                            <input
                                type="number"
                                value={minQuantity}
                                onChange={(e) => setMinQuantity(e.target.value)}
                                placeholder="50"
                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Delivery Days (after close)</label>
                            <input
                                type="number"
                                value={deliveryDays}
                                onChange={(e) => setDeliveryDays(e.target.value)}
                                placeholder="25"
                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded font-medium transition-colors disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="animate-spin" size={18} /> : "Create Campaign"}
                        </button>
                        <button
                            type="button"
                            onClick={() => { setShowForm(false); resetForm(); }}
                            className="bg-zinc-700 hover:bg-zinc-600 text-white px-6 py-2 rounded font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {/* Campaigns List */}
            {campaigns.length === 0 ? (
                <div className="text-center py-20 bg-zinc-900 border border-zinc-800 rounded-lg">
                    <Calendar size={48} className="mx-auto mb-4 text-gray-600" />
                    <h2 className="text-xl font-bold text-white mb-2">No Campaigns</h2>
                    <p className="text-gray-400">Create your first pre-order campaign</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {campaigns.map((campaign) => {
                        const StatusIcon = STATUS_ICONS[campaign.status] || Clock;
                        const progress = getProgress(campaign);
                        const daysLeft = getDaysRemaining(campaign.endDate);
                        const isActive = campaign.status === "active";

                        return (
                            <div
                                key={campaign.id}
                                className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden"
                            >
                                {/* Campaign Header */}
                                <div className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                                    {/* Product Image */}
                                    <div className="w-20 h-20 bg-zinc-800 rounded-lg overflow-hidden shrink-0">
                                        {campaign.product.images?.[0] && (
                                            <img
                                                src={campaign.product.images[0]}
                                                alt={campaign.product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-lg font-bold text-white truncate">{campaign.name}</h3>
                                            <span className={`text-xs px-2 py-0.5 rounded capitalize ${STATUS_COLORS[campaign.status]} text-white`}>
                                                {campaign.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-400 mb-2">
                                            {campaign.product.name}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-4 text-sm">
                                            <span className="text-gray-500">
                                                {formatDate(campaign.startDate)} → {formatDate(campaign.endDate)}
                                            </span>
                                            {isActive && daysLeft > 0 && (
                                                <span className="text-yellow-400 flex items-center gap-1">
                                                    <Clock size={14} /> {daysLeft} days left
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center gap-6 shrink-0">
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-white">{campaign.totalQuantity}</p>
                                            <p className="text-xs text-gray-500">/ {campaign.minQuantity} min</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-green-400">₹{campaign.totalRevenue.toLocaleString()}</p>
                                            <p className="text-xs text-gray-500">revenue</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                {(isActive || campaign.status === "closed") && (
                                    <div className="px-5 pb-3">
                                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all ${progress >= 100 ? 'bg-green-500' : 'bg-purple-500'}`}
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {progress}% of minimum
                                            {progress >= 100 && <span className="text-green-400 ml-2">✓ Goal reached!</span>}
                                        </p>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="px-5 py-3 bg-zinc-800/50 flex items-center justify-between">
                                    <Link
                                        href={`/campaigns/${campaign.id}`}
                                        className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
                                    >
                                        View Details <ChevronRight size={14} />
                                    </Link>

                                    <div className="flex items-center gap-2">
                                        {campaign.status === "draft" && (
                                            <>
                                                <button
                                                    onClick={() => handleAction(campaign.id, "activate")}
                                                    disabled={actionLoading === campaign.id}
                                                    className="flex items-center gap-1 text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                                                >
                                                    {actionLoading === campaign.id ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                                                    Activate
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(campaign.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </>
                                        )}

                                        {campaign.status === "active" && (
                                            <button
                                                onClick={() => handleAction(campaign.id, "close")}
                                                disabled={actionLoading === campaign.id}
                                                className="flex items-center gap-1 text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                                            >
                                                {actionLoading === campaign.id ? <Loader2 size={14} className="animate-spin" /> : <Square size={14} />}
                                                Close Campaign
                                            </button>
                                        )}

                                        {campaign.status === "closed" && (
                                            <button
                                                onClick={() => handleAction(campaign.id, "start_production")}
                                                disabled={actionLoading === campaign.id}
                                                className="flex items-center gap-1 text-sm bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                                            >
                                                {actionLoading === campaign.id ? <Loader2 size={14} className="animate-spin" /> : <Factory size={14} />}
                                                Start Production
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
