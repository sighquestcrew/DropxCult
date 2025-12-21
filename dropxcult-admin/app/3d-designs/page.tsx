"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Loader2, Check, X, DollarSign, Eye, Search, Copy } from "lucide-react";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

export default function Admin3DDesignsPage() {
    return (
        <Suspense fallback={<div className="p-10"><Loader2 className="animate-spin text-purple-600" /></div>}>
            <Admin3DDesignsContent />
        </Suspense>
    );
}

function Admin3DDesignsContent() {
    const { userInfo } = useSelector((state: RootState) => state.auth);
    const queryClient = useQueryClient();
    const searchParams = useSearchParams();

    const [selectedDesign, setSelectedDesign] = useState<any>(null);
    const [mounted, setMounted] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Compliance checklist for approval
    const [compliance, setCompliance] = useState({
        notSexual: false,
        validName: false,
        notOffensive: false,
        meetsGuidelines: false,
    });
    const allComplianceChecked = Object.values(compliance).every(Boolean);

    // Reset compliance when design changes
    const handleSelectDesign = (design: any) => {
        setSelectedDesign(design);
        setCompliance({ notSexual: false, validName: false, notOffensive: false, meetsGuidelines: false });
    };

    // Get design ID from URL to auto-select
    const autoSelectId = searchParams.get("id");

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    // Fetch All 3D Designs
    const { data: designs, isLoading } = useQuery({
        queryKey: ["admin-3d-designs"],
        queryFn: async () => {
            const { data } = await axios.get("/api/designs", {
                headers: { Authorization: `Bearer ${userInfo?.token}` }
            });
            return data;
        },
        enabled: mounted && !!userInfo?.token,
    });

    // Auto-select design from URL parameter
    useEffect(() => {
        if (autoSelectId && designs) {
            const design = designs.find((d: any) => d.id === autoSelectId);
            if (design) {
                setSelectedDesign(design);
            }
        }
    }, [autoSelectId, designs]);

    // Filter designs based on search query AND status filter
    const filteredDesigns = designs?.filter((design: any) => {
        // Status filter
        if (statusFilter !== "all" && design.status !== statusFilter) return false;
        // Search filter - includes ID, name, and email
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return design.id?.toLowerCase().includes(query) ||
            design.name?.toLowerCase().includes(query) ||
            design.user?.email?.toLowerCase().includes(query);
    }) || [];

    // Status filter options
    const statusOptions = [
        { value: "all", label: "All", color: "bg-zinc-700 hover:bg-zinc-600" },
        { value: "Draft", label: "Draft", color: "bg-gray-700 hover:bg-gray-600" },
        { value: "Pending", label: "Pending", color: "bg-blue-700 hover:bg-blue-600" },
        { value: "Accepted", label: "Accepted", color: "bg-green-700 hover:bg-green-600" },
        { value: "Rejected", label: "Rejected", color: "bg-red-700 hover:bg-red-600" },
        { value: "Royalty_Pending", label: "Royalty", color: "bg-yellow-700 hover:bg-yellow-600" },
    ];

    // Action Mutation (Accept/Reject/Royalty)
    const actionMutation = useMutation({
        mutationFn: async ({ id, action, reason }: { id: string; action: string; reason?: string }) => {
            await axios.post(`/api/designs/${id}/action`, { action, reason }, {
                headers: { Authorization: `Bearer ${userInfo?.token}` }
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-3d-designs"] });
            toast.success("Status Updated");
            setSelectedDesign(null);
        },
        onError: () => toast.error("Action Failed"),
    });

    // Show loading until mounted and data is loading
    if (!mounted || isLoading) return <div className="p-10"><Loader2 className="animate-spin text-purple-600" /></div>;

    return (
        <>
            <div className="text-white">
                {/* Header - stacks on mobile */}
                <div className="flex flex-col gap-4 mb-4 md:mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <h1 className="text-2xl md:text-3xl font-bold">3D Designs</h1>
                        {/* Search Input */}
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Filter designs..."
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:border-purple-600 focus:outline-none"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Status Filter Buttons - horizontal scroll on mobile */}
                    <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap scrollbar-hide">
                        {statusOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setStatusFilter(option.value)}
                                className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 ${statusFilter === option.value
                                    ? `${option.color} ring-2 ring-white/30`
                                    : "bg-zinc-800 hover:bg-zinc-700 text-gray-400"
                                    }`}
                            >
                                {option.label}
                                <span className="ml-1 text-xs opacity-70">
                                    ({option.value === "all"
                                        ? designs?.length || 0
                                        : designs?.filter((d: any) => d.status === option.value).length || 0})
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content - single column on mobile */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">

                    {/* LIST SECTION */}
                    <div className="space-y-3 md:space-y-4 max-h-[50vh] lg:max-h-[75vh] overflow-y-auto custom-scrollbar pr-1 md:pr-2">
                        {filteredDesigns?.map((design: any) => (
                            <div
                                key={design.id}
                                className={`bg-zinc-900 p-3 md:p-4 rounded border cursor-pointer transition ${selectedDesign?.id === design.id ? "border-purple-600 bg-zinc-800" : "border-zinc-800 hover:border-gray-600"}`}
                                onClick={() => handleSelectDesign(design)}
                            >
                                <div className="flex gap-3 md:gap-4">
                                    {/* Thumbnail */}
                                    <div className="h-16 w-16 md:h-20 md:w-20 bg-black rounded overflow-hidden relative border border-zinc-700 flex-shrink-0">
                                        {design.previewImage ? (
                                            <img src={design.previewImage} className="object-cover h-full w-full" alt="preview" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-xs text-gray-600">No Preview</div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-2">
                                            <h3 className="font-bold text-sm md:text-base truncate">{design.name || "Untitled"}</h3>
                                            <span className={`text-[10px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded flex-shrink-0 ${design.status === "Pending" ? "bg-blue-900 text-blue-300" :
                                                design.status === "Accepted" ? "bg-green-900 text-green-300" :
                                                    design.status === "Draft" ? "bg-gray-700 text-gray-300" :
                                                        design.status === "Royalty_Pending" ? "bg-yellow-900 text-yellow-300" :
                                                            "bg-red-900 text-red-300"
                                                }`}>{design.status}</span>
                                        </div>
                                        <p className="text-[10px] md:text-xs text-gray-400 truncate">{design.user?.email}</p>
                                        <p className="text-xs md:text-sm mt-1 font-mono text-gray-300 truncate">
                                            {design.tshirtType} | {design.tshirtColor}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filteredDesigns.length === 0 && (
                            <p className="text-gray-500 text-sm md:text-base py-8 text-center">
                                {searchQuery ? `No designs matching "${searchQuery}"` : "No 3D designs to review."}
                            </p>
                        )}
                    </div>

                    {/* PREVIEW & ACTION PANEL - Hidden on mobile, shows as modal when design selected */}
                    <div className="hidden lg:block sticky top-4 h-fit">
                        {selectedDesign ? (
                            <div className="bg-zinc-900 border border-zinc-800 rounded p-6">
                                <h3 className="font-bold mb-4 border-b border-zinc-800 pb-2 flex justify-between items-center">
                                    <span className="truncate">Inspecting: {selectedDesign.name}</span>
                                    <span className="text-xs text-gray-500 ml-2 flex-shrink-0">{selectedDesign.id.slice(0, 8)}...</span>
                                </h3>

                                {/* Preview Image */}
                                <div className="h-[300px] mb-4 bg-black rounded flex items-center justify-center overflow-hidden">
                                    {selectedDesign.previewImage ? (
                                        <img
                                            src={selectedDesign.previewImage}
                                            className="max-h-full max-w-full object-contain"
                                            alt="design preview"
                                        />
                                    ) : (
                                        <div className="text-gray-600">No preview available</div>
                                    )}
                                </div>

                                {/* Design Details */}
                                <div className="text-sm text-gray-400 mb-4 space-y-2">
                                    {/* Design ID with copy */}
                                    <div className="bg-zinc-950 p-3 rounded border border-zinc-800">
                                        <div className="flex items-center justify-between gap-2">
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Design ID</p>
                                                <p className="font-mono text-xs text-green-400 break-all">{selectedDesign.id}</p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(selectedDesign.id);
                                                    toast.success("Design ID copied!");
                                                }}
                                                className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-gray-400 hover:text-white transition flex-shrink-0"
                                            >
                                                <Copy size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <p>Type: <span className="text-white">{selectedDesign.tshirtType}</span></p>
                                        <p>Color: <span className="text-white">{selectedDesign.tshirtColor}</span></p>
                                        <p>Created: <span className="text-white">{new Date(selectedDesign.createdAt).toLocaleDateString()}</span></p>
                                        <p>User: <span className="text-white">{selectedDesign.user?.name}</span></p>
                                    </div>
                                </div>

                                {/* View in 3D Button */}
                                <a
                                    href={`http://localhost:3000?designId=${selectedDesign.id}&viewOnly=true`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full mb-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 rounded font-bold flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Eye size={18} />
                                    View in 3D
                                </a>

                                {/* ACTION BUTTONS */}
                                {selectedDesign.status === "Pending" && (
                                    <>
                                        {/* Compliance Checklist */}
                                        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 mt-4 mb-3">
                                            <p className="text-sm font-semibold text-gray-300 mb-3">✓ Approval Checklist</p>
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer hover:text-white">
                                                    <input type="checkbox" checked={compliance.notSexual} onChange={(e) => setCompliance(prev => ({ ...prev, notSexual: e.target.checked }))} className="w-4 h-4 rounded bg-zinc-800 border-zinc-600 text-green-500 focus:ring-green-500" />
                                                    Design is NOT sexual or nude
                                                </label>
                                                <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer hover:text-white">
                                                    <input type="checkbox" checked={compliance.validName} onChange={(e) => setCompliance(prev => ({ ...prev, validName: e.target.checked }))} className="w-4 h-4 rounded bg-zinc-800 border-zinc-600 text-green-500 focus:ring-green-500" />
                                                    Design has valid & appropriate name
                                                </label>
                                                <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer hover:text-white">
                                                    <input type="checkbox" checked={compliance.notOffensive} onChange={(e) => setCompliance(prev => ({ ...prev, notOffensive: e.target.checked }))} className="w-4 h-4 rounded bg-zinc-800 border-zinc-600 text-green-500 focus:ring-green-500" />
                                                    Design is NOT offensive (hate speech, violence)
                                                </label>
                                                <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer hover:text-white">
                                                    <input type="checkbox" checked={compliance.meetsGuidelines} onChange={(e) => setCompliance(prev => ({ ...prev, meetsGuidelines: e.target.checked }))} className="w-4 h-4 rounded bg-zinc-800 border-zinc-600 text-green-500 focus:ring-green-500" />
                                                    Complies with community guidelines
                                                </label>
                                            </div>
                                            {!allComplianceChecked && (
                                                <p className="text-xs text-yellow-500 mt-2">⚠ Check all boxes to enable Accept</p>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <button
                                                onClick={() => actionMutation.mutate({ id: selectedDesign.id, action: "accept" })}
                                                disabled={actionMutation.isPending || !allComplianceChecked}
                                                className={`bg-green-600 hover:bg-green-700 py-3 rounded font-bold text-sm flex flex-col items-center gap-1 ${(actionMutation.isPending || !allComplianceChecked) ? "opacity-50 cursor-not-allowed" : ""}`}
                                            >
                                                {actionMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                                                {actionMutation.isPending ? "..." : "Accept"}
                                            </button>
                                            <button
                                                onClick={() => setShowRejectModal(true)}
                                                disabled={actionMutation.isPending}
                                                className={`bg-red-600 hover:bg-red-700 py-3 rounded font-bold text-sm flex flex-col items-center gap-1 ${actionMutation.isPending ? "opacity-70 cursor-not-allowed" : ""}`}
                                            >
                                                {actionMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <X size={18} />}
                                                {actionMutation.isPending ? "..." : "Reject"}
                                            </button>
                                            <button
                                                onClick={() => actionMutation.mutate({ id: selectedDesign.id, action: "offer_royalty" })}
                                                disabled={actionMutation.isPending || !allComplianceChecked}
                                                className={`bg-yellow-600 hover:bg-yellow-700 py-3 rounded font-bold text-sm flex flex-col items-center gap-1 ${(actionMutation.isPending || !allComplianceChecked) ? "opacity-50 cursor-not-allowed" : ""}`}
                                            >
                                                {actionMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <DollarSign size={18} />}
                                                {actionMutation.isPending ? "..." : "Royalty"}
                                            </button>
                                        </div>
                                    </>
                                )}

                                {selectedDesign.status !== "Pending" && (
                                    <div className="text-center p-4 bg-black rounded text-gray-400 text-sm">
                                        Design is already processed ({selectedDesign.status})
                                    </div>
                                )}

                            </div>
                        ) : (
                            <div className="h-[300px] border-2 border-dashed border-zinc-800 rounded flex flex-col items-center justify-center text-gray-500">
                                <Eye size={48} className="mb-4 opacity-50" />
                                <p>Select a design from the list</p>
                                <p className="text-sm">to inspect and approve</p>
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* Mobile Preview Modal - Shows when design is selected on mobile */}
            {selectedDesign && (
                <div className="lg:hidden fixed inset-0 bg-black/90 z-50 flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                        <h3 className="font-bold text-white truncate flex-1">{selectedDesign.name}</h3>
                        <button
                            onClick={() => setSelectedDesign(null)}
                            className="p-2 hover:bg-zinc-800 rounded-lg ml-2"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content - scrollable */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {/* Preview Image */}
                        <div className="h-[250px] mb-4 bg-zinc-900 rounded flex items-center justify-center overflow-hidden">
                            {selectedDesign.previewImage ? (
                                <img
                                    src={selectedDesign.previewImage}
                                    className="max-h-full max-w-full object-contain"
                                    alt="design preview"
                                />
                            ) : (
                                <div className="text-gray-600">No preview available</div>
                            )}
                        </div>

                        {/* Status Badge */}
                        <div className="flex justify-center mb-4">
                            <span className={`text-sm font-bold px-3 py-1.5 rounded ${selectedDesign.status === "Pending" ? "bg-blue-900 text-blue-300" :
                                selectedDesign.status === "Accepted" ? "bg-green-900 text-green-300" :
                                    selectedDesign.status === "Draft" ? "bg-gray-700 text-gray-300" :
                                        selectedDesign.status === "Royalty_Pending" ? "bg-yellow-900 text-yellow-300" :
                                            "bg-red-900 text-red-300"
                                }`}>{selectedDesign.status}</span>
                        </div>

                        {/* Design Details */}
                        <div className="text-sm text-gray-400 mb-4 space-y-2">
                            {/* Design ID with copy */}
                            <div className="bg-zinc-900 p-3 rounded border border-zinc-700">
                                <div className="flex items-center justify-between gap-2">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Design ID</p>
                                        <p className="font-mono text-xs text-green-400 break-all">{selectedDesign.id}</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(selectedDesign.id);
                                            toast.success("Design ID copied!");
                                        }}
                                        className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-gray-400 hover:text-white transition flex-shrink-0"
                                    >
                                        <Copy size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 bg-zinc-900 p-3 rounded">
                                <p>Type: <span className="text-white">{selectedDesign.tshirtType}</span></p>
                                <p>Color: <span className="text-white">{selectedDesign.tshirtColor}</span></p>
                                <p>Created: <span className="text-white">{new Date(selectedDesign.createdAt).toLocaleDateString()}</span></p>
                                <p>User: <span className="text-white truncate">{selectedDesign.user?.name}</span></p>
                            </div>
                        </div>

                        {/* View in 3D Button */}
                        <a
                            href={`http://localhost:3000?designId=${selectedDesign.id}&viewOnly=true`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full mb-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 rounded font-bold flex items-center justify-center gap-2"
                        >
                            <Eye size={18} />
                            View in 3D
                        </a>

                        {/* ACTION BUTTONS */}
                        {selectedDesign.status === "Pending" && (
                            <>
                                {/* Compliance Checklist - Mobile */}
                                <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 mb-3">
                                    <p className="text-sm font-semibold text-gray-300 mb-2">✓ Approval Checklist</p>
                                    <div className="space-y-1.5">
                                        <label className="flex items-center gap-2 text-xs text-gray-400">
                                            <input type="checkbox" checked={compliance.notSexual} onChange={(e) => setCompliance(prev => ({ ...prev, notSexual: e.target.checked }))} className="w-4 h-4 rounded" />
                                            Not sexual/nude
                                        </label>
                                        <label className="flex items-center gap-2 text-xs text-gray-400">
                                            <input type="checkbox" checked={compliance.validName} onChange={(e) => setCompliance(prev => ({ ...prev, validName: e.target.checked }))} className="w-4 h-4 rounded" />
                                            Valid name
                                        </label>
                                        <label className="flex items-center gap-2 text-xs text-gray-400">
                                            <input type="checkbox" checked={compliance.notOffensive} onChange={(e) => setCompliance(prev => ({ ...prev, notOffensive: e.target.checked }))} className="w-4 h-4 rounded" />
                                            Not offensive
                                        </label>
                                        <label className="flex items-center gap-2 text-xs text-gray-400">
                                            <input type="checkbox" checked={compliance.meetsGuidelines} onChange={(e) => setCompliance(prev => ({ ...prev, meetsGuidelines: e.target.checked }))} className="w-4 h-4 rounded" />
                                            Meets guidelines
                                        </label>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        onClick={() => actionMutation.mutate({ id: selectedDesign.id, action: "accept" })}
                                        disabled={actionMutation.isPending || !allComplianceChecked}
                                        className={`bg-green-600 hover:bg-green-700 py-3 rounded font-bold text-sm flex flex-col items-center gap-1 ${(actionMutation.isPending || !allComplianceChecked) ? "opacity-50 cursor-not-allowed" : ""}`}
                                    >
                                        {actionMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                                        Accept
                                    </button>
                                    <button
                                        onClick={() => setShowRejectModal(true)}
                                        disabled={actionMutation.isPending}
                                        className={`bg-red-600 hover:bg-red-700 py-3 rounded font-bold text-sm flex flex-col items-center gap-1 ${actionMutation.isPending ? "opacity-70 cursor-not-allowed" : ""}`}
                                    >
                                        {actionMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <X size={18} />}
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => actionMutation.mutate({ id: selectedDesign.id, action: "offer_royalty" })}
                                        disabled={actionMutation.isPending || !allComplianceChecked}
                                        className={`bg-yellow-600 hover:bg-yellow-700 py-3 rounded font-bold text-sm flex flex-col items-center gap-1 ${(actionMutation.isPending || !allComplianceChecked) ? "opacity-50 cursor-not-allowed" : ""}`}
                                    >
                                        {actionMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <DollarSign size={18} />}
                                        Royalty
                                    </button>
                                </div>
                            </>
                        )}

                        {selectedDesign.status !== "Pending" && (
                            <div className="text-center p-4 bg-zinc-900 rounded text-gray-400 text-sm">
                                Design is already processed ({selectedDesign.status})
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Rejection Reason Modal */}
            {
                showRejectModal && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
                        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 md:p-6 w-full max-w-md">
                            <h3 className="text-lg font-bold text-white mb-4">Rejection Reason</h3>
                            <p className="text-gray-400 text-sm mb-4">
                                Please provide a reason for rejecting &quot;{selectedDesign?.name}&quot;:
                            </p>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="e.g., Copyright issues, inappropriate content, low quality..."
                                className="w-full bg-black border border-zinc-700 rounded p-3 text-white text-sm h-32 resize-none focus:border-red-500 focus:outline-none"
                            />
                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={() => {
                                        setShowRejectModal(false);
                                        setRejectionReason("");
                                    }}
                                    className="flex-1 border border-zinc-600 text-gray-400 py-2 rounded font-bold hover:bg-zinc-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        actionMutation.mutate({
                                            id: selectedDesign.id,
                                            action: "reject",
                                            reason: rejectionReason
                                        });
                                        setShowRejectModal(false);
                                        setRejectionReason("");
                                    }}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded font-bold"
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    );
}

