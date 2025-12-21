"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Loader2, Plus, CheckCircle, XCircle, AlertTriangle, ShoppingCart, Trash2, Pencil, Globe, GlobeLock, MoreVertical, HelpCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import React from "react";
import { useRouter } from "next/navigation";
import { addToCart } from "../../redux/slices/cartSlice";

export default function CustomizeDashboard() {
  const router = useRouter();
  const [isMounted, setIsMounted] = React.useState(false);
  const [rejectionModal, setRejectionModal] = React.useState<{ open: boolean; reason: string; name: string }>({ open: false, reason: "", name: "" });
  const [cartModal, setCartModal] = React.useState<{ open: boolean; design: any; size: string; qty: number }>({ open: false, design: null, size: "L", qty: 1 });
  const [renameModal, setRenameModal] = React.useState<{ open: boolean; designId: string; currentName: string; newName: string }>({ open: false, designId: "", currentName: "", newName: "" });
  const [loadingId, setLoadingId] = React.useState<string | null>(null); // Track which item is loading
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null); // Track which action menu is open
  const [royaltyInfoModal, setRoyaltyInfoModal] = React.useState(false); // Modal state for help info

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const dispatch = useDispatch();
  const { userInfo } = useSelector((state: RootState) => state.auth);
  const queryClient = useQueryClient();

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/customize/${id}`, {
        headers: { Authorization: `Bearer ${userInfo?.token}` }
      });
    },
    onSuccess: () => {
      setLoadingId(null);
      toast.success("Design Deleted");
      queryClient.invalidateQueries({ queryKey: ["my-designs"] });
    },
    onError: () => { setLoadingId(null); toast.error("Failed to delete"); },
  });

  // Re-request Mutation (for rejected designs)
  const rerequestMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.post(`/api/customize/${id}/rerequest`, {}, {
        headers: { Authorization: `Bearer ${userInfo?.token}` }
      });
    },
    onSuccess: () => {
      setLoadingId(null);
      toast.success("Design re-submitted for approval!");
      queryClient.invalidateQueries({ queryKey: ["my-designs"] });
    },
    onError: () => { setLoadingId(null); toast.error("Failed to re-request"); },
  });

  // Cancel Request Mutation (keeps design as draft)
  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.post(`/api/customize/${id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${userInfo?.token}` }
      });
    },
    onSuccess: () => {
      setLoadingId(null);
      toast.success("Request cancelled - design saved as draft");
      queryClient.invalidateQueries({ queryKey: ["my-designs"] });
    },
    onError: () => { setLoadingId(null); toast.error("Failed to cancel request"); },
  });

  // Toggle Visibility Mutation (public/private)
  const visibilityMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await axios.post(`/api/customize/${id}/visibility`, {}, {
        headers: { Authorization: `Bearer ${userInfo?.token}` }
      });
      return data;
    },
    onSuccess: (data) => {
      setLoadingId(null);
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["my-designs"] });
    },
    onError: () => { setLoadingId(null); toast.error("Failed to update visibility"); },
  });

  // Toggle 3D Design Visibility (Post to Community)
  const visibility3DMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await axios.post(`/api/designs/${id}/visibility`, {}, {
        headers: { Authorization: `Bearer ${userInfo?.token}` }
      });
      return data;
    },
    onSuccess: (data) => {
      setLoadingId(null);
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["my-designs"] });
    },
    onError: () => { setLoadingId(null); toast.error("Only approved designs can be posted"); },
  });

  // Rename Design Mutation
  const renameMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data } = await axios.patch(`/api/customize/${id}/rename`, { name }, {
        headers: { Authorization: `Bearer ${userInfo?.token}` }
      });
      return data;
    },
    onSuccess: () => {
      toast.success("Design renamed successfully");
      setRenameModal({ open: false, designId: "", currentName: "", newName: "" });
      queryClient.invalidateQueries({ queryKey: ["my-designs"] });
    },
    onError: () => toast.error("Failed to rename design"),
  });

  const { data: requests, isLoading, refetch } = useQuery({
    queryKey: ["my-designs", userInfo?._id],
    queryFn: async () => {
      if (!userInfo) return [];
      const { data } = await axios.get("/api/customize", {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      return data;
    },
    enabled: !!userInfo,
  });

  const handleRoyalty = async (id: string, accept: boolean) => {
    try {
      await axios.post(`/api/customize/${id}/royalty`, { accept }, {
        headers: { Authorization: `Bearer ${userInfo?.token}` }
      });
      toast.success(accept ? "You accepted the deal!" : "You kept the design private.");
      refetch();
    } catch (e) {
      toast.error("Action failed");
    }
  };

  // 👇 UPDATED: Pricing Logic to match Backend
  const handleAddToCart = (req: any) => {
    // 1. Check for Sleeves (Images OR Text)
    const hasSleeveImages =
      (req.leftImage && req.leftImage !== "") ||
      (req.rightImage && req.rightImage !== "") ||
      (req.leftSleeveImage && req.leftSleeveImage !== "") ||
      (req.rightSleeveImage && req.rightSleeveImage !== "");

    // Safely check text config
    const leftText = req.textConfig?.left?.content;
    const rightText = req.textConfig?.right?.content;
    const hasSleeveText = (leftText && leftText.trim() !== "") || (rightText && rightText.trim() !== "");

    const hasSleeves = hasSleeveImages || hasSleeveText;

    // 2. Determine Price
    // If Hoodie: Standard 3000 (or add logic if needed)
    // If T-Shirt: 999 base, 1199 if sleeves
    let price = 0;

    if (req.type === "Hoodie") {
      price = 3000; // Adjust hoodie logic here if needed
    } else {
      price = hasSleeves ? 1199 : 999;
    }

    // Handle 3D designs with different structure
    if (req.is3D) {
      // Open cart modal for size/qty selection
      setCartModal({ open: true, design: req, size: "L", qty: 1 });
      return; // Don't add yet, wait for modal confirmation
    } else {
      // 2D designs (CustomRequest) - add directly
      dispatch(addToCart({
        id: req.id,
        name: `Custom ${req.type} - ${req.color}`,
        slug: `custom-${req.id}`,
        image: req.frontImage,
        price: price,
        size: req.size,
        qty: 1,
        isCustom: true,
        designId: req.id
      }));

      toast.success(`Added to Cart @ ₹${price}`);
      router.push("/cart");
    }
  };

  // Confirm add to cart from modal (for 3D designs)
  const confirmAddToCart = () => {
    const req = cartModal.design;
    if (!req) return;

    // Calculate price - flat ₹999 for all custom designs
    const price = 999;

    dispatch(addToCart({
      id: req.id,
      name: req.name || `Custom 3D T-Shirt`,
      slug: `custom-3d-${req.id}`,
      image: req.previewImage || '/placeholder-design.png',
      price: price,
      size: cartModal.size,
      qty: cartModal.qty,
      isCustom: true,
      designId: req.id
    }));

    setCartModal({ open: false, design: null, size: "L", qty: 1 });
    toast.success(`Added to Cart @ ₹${price}`);
    router.push("/cart");
  };

  if (!isMounted || isLoading) return <div className="h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-red-600" /></div>;

  return (
    <div className="min-h-screen bg-black text-white pt-10 pb-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-bold tracking-tighter mb-2">CUSTOM ARTIFACTS</h1>
            <p className="text-gray-400">Your personal collection of mythology.</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Link href="/customize/design" className="flex-1 sm:flex-initial">
              <button className="bg-white text-black px-3 sm:px-6 py-3 text-sm sm:text-base font-bold rounded flex items-center gap-2 hover:bg-gray-200 transition-colors w-full justify-center whitespace-nowrap">
                <Plus size={18} /> Create New
              </button>
            </Link>
            <Link
              href={`${process.env.NEXT_PUBLIC_EDITOR_URL || 'http://localhost:3000'}?userId=${userInfo?._id}&token=${userInfo?.token}&userName=${encodeURIComponent(userInfo?.name || '')}&isAdmin=${userInfo?.isAdmin}`}
              target="_blank"
              className="flex-1 sm:flex-initial"
            >
              <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 sm:px-6 py-3 text-sm sm:text-base font-bold rounded flex items-center gap-2 hover:from-purple-700 hover:to-pink-700 transition-colors w-full justify-center whitespace-nowrap">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M2 12h20" />
                  <path d="M7 7l10 10M7 17l10-10" />
                </svg>
                3D Editor
              </button>
            </Link>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8">
          {requests?.map((req: any) => (
            <div key={req.id} className="group block relative z-0 hover:z-10">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col h-full hover:border-zinc-600 transition-all duration-300">

                {/* Image */}
                <div className="aspect-square relative overflow-hidden bg-zinc-800 rounded-t-xl">
                  {req.frontImage ? (
                    <img
                      src={req.frontImage}
                      alt="Design Preview"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 font-bold">
                      NO PREVIEW
                    </div>
                  )}

                  {/* Status Badge Overlay */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1 items-end pointer-events-none">
                    {/* Combine badges or limit count if needed, but 1-col grid solves most space issues */}
                    {req.is3D && <span className="bg-purple-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm backdrop-blur-sm">3D</span>}
                    {req.status === "Accepted" && <span className="bg-green-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm backdrop-blur-sm">APPROVED</span>}
                    {req.status === "Accepted" && req.hasRoyaltyOffer && <span className="bg-yellow-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm backdrop-blur-sm">ROYALTY</span>}
                    {req.status === "Rejected" && <span className="bg-red-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm backdrop-blur-sm">REJECTED</span>}
                    {req.status === "Pending" && <span className="bg-zinc-600/90 text-zinc-200 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm backdrop-blur-sm">PENDING</span>}
                    {req.status === "Royalty_Pending" && <span className="bg-yellow-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm backdrop-blur-sm">OFFER</span>}
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 flex flex-col flex-1">
                  <div className="text-xs text-red-500 mb-1 uppercase tracking-widest font-semibold">
                    {req.type}
                  </div>
                  <div className="flex items-center gap-1 mb-1">
                    <h3 className="text-lg font-bold text-white leading-tight truncate flex-1">
                      {req.is3D ? req.name : `${req.color} Edition`}
                    </h3>
                    {req.is3D && (
                      <button
                        onClick={() => setRenameModal({ open: true, designId: req.id, currentName: req.name, newName: req.name })}
                        className="p-1 hover:bg-zinc-700 rounded text-gray-400 hover:text-white transition-colors"
                        title="Rename design"
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm mb-2">Size: {req.size}</p>

                  {/* Rejection Reason Display - Click to open popup */}
                  {req.status === "Rejected" && req.rejectionReason && (
                    <button
                      onClick={() => setRejectionModal({ open: true, reason: req.rejectionReason, name: req.name || req.type })}
                      className="w-full bg-red-900/20 border border-red-800/30 rounded p-2 mb-3 text-left hover:bg-red-900/30 transition-colors cursor-pointer"
                    >
                      <p className="text-xs text-red-400 font-semibold mb-1">Rejection Reason:</p>
                      <p className="text-xs text-gray-300 line-clamp-2">{req.rejectionReason}</p>
                      <p className="text-xs text-red-400 mt-1 underline">Click to view full reason</p>
                    </button>
                  )}

                  {/* Royalty Pending Alert */}
                  {req.status === "Royalty_Pending" && (
                    <div className="bg-yellow-900/20 border border-yellow-600/30 p-2 rounded text-center mb-2">
                      <p className="text-yellow-500 text-xs font-bold mb-2 flex items-center justify-center gap-1">
                        <AlertTriangle size={12} /> Make Public?
                        <button
                          onClick={(e) => { e.stopPropagation(); setRoyaltyInfoModal(true); }}
                          className="text-gray-400 hover:text-white transition-colors"
                          title="What does this mean?"
                        >
                          <HelpCircle size={12} />
                        </button>
                      </p>

                      <div className="flex gap-2 justify-center">
                        <button onClick={() => handleRoyalty(req.id, true)} className="bg-green-600 text-white text-[10px] px-2 py-1 rounded hover:bg-green-500">Accept</button>
                        <button onClick={() => handleRoyalty(req.id, false)} className="bg-red-600 text-white text-[10px] px-2 py-1 rounded hover:bg-red-500">Reject</button>
                      </div>
                    </div>
                  )}

                  {/* Actions - Compact Row */}
                  <div className="mt-auto pt-4 flex gap-2 items-center relative">

                    {/* Primary Button Logic */}
                    <div className="flex-1">
                      {req.status === "Accepted" ? (
                        <button
                          onClick={() => handleAddToCart(req)}
                          className="w-full bg-white hover:bg-gray-200 text-black py-2.5 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors uppercase tracking-wide"
                        >
                          <ShoppingCart size={14} /> Add to Cart
                        </button>
                      ) : (req.status === "Draft" || req.status === "Rejected") ? (
                        req.is3D ? (
                          <Link
                            href={`${process.env.NEXT_PUBLIC_EDITOR_URL || 'http://localhost:3000'}?userId=${userInfo?._id}&token=${userInfo?.token}&userName=${encodeURIComponent(userInfo?.name || '')}&designId=${req.id}`}
                            target="_blank"
                            className="block w-full"
                          >
                            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors uppercase tracking-wide">
                              <Pencil size={14} /> Edit Design
                            </button>
                          </Link>
                        ) : null
                      ) : req.status === "Pending" && req.is3D ? (
                        <button
                          onClick={() => {
                            if (confirm("Cancel this request?")) cancelMutation.mutate(req.id);
                          }}
                          className="w-full border border-zinc-700 hover:bg-zinc-800 text-zinc-400 py-2.5 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors uppercase tracking-wide"
                        >
                          Cancel Request
                        </button>
                      ) : (
                        <div className="w-full bg-zinc-800 text-zinc-500 py-2.5 text-xs font-bold rounded-lg flex items-center justify-center gap-2 uppercase tracking-wide cursor-not-allowed">
                          Processing
                        </div>
                      )}
                    </div>

                    {/* More Options Menu */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === req.id ? null : req.id);
                        }}
                        className={`p-2.5 rounded-lg border transition-colors ${openMenuId === req.id ? 'bg-zinc-800 border-zinc-600 text-white' : 'border-zinc-800 hover:border-zinc-600 text-gray-400 hover:text-white'}`}
                      >
                        <MoreVertical size={16} />
                      </button>

                      {/* Dropdown Content */}
                      {openMenuId === req.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
                          <div className="absolute bottom-full right-0 mb-2 w-48 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col py-1 animate-in fade-in zoom-in-95 duration-200 origin-bottom-right">

                            {/* Visibility Toggle */}
                            {req.is3D && req.status === "Accepted" && (
                              <>
                                <button
                                  onClick={() => { setLoadingId(req.id); visibility3DMutation.mutate(req.id); setOpenMenuId(null); }}
                                  disabled={loadingId === req.id}
                                  className="w-full text-left px-4 py-3 text-xs font-medium hover:bg-zinc-700 text-gray-200 flex items-center gap-2"
                                >
                                  {req.isPublic ? <Globe size={14} className="text-green-500" /> : <GlobeLock size={14} className="text-gray-500" />}
                                  {req.isPublic ? "Remove from Community" : "Post to Community"}
                                </button>
                                {req.hasRoyaltyOffer && (
                                  <button
                                    onClick={() => { setLoadingId(req.id); visibilityMutation.mutate(req.id); setOpenMenuId(null); }}
                                    disabled={loadingId === req.id}
                                    className="w-full text-left px-4 py-3 text-xs font-medium hover:bg-zinc-700 text-cyan-400 flex items-center gap-2 border-t border-zinc-700/50"
                                  >
                                    <ShoppingCart size={14} /> {req.isPublic ? "Remove from Shop" : "Sell in Shop"}
                                  </button>
                                )}
                              </>
                            )}

                            {/* Request Royalty */}
                            {req.is3D && req.status === "Accepted" && req.wasOfferedRoyalty && !req.hasRoyaltyOffer && (
                              <button
                                onClick={async () => {
                                  try {
                                    setOpenMenuId(null);
                                    await axios.post(`/api/customize/${req.id}/rerequest`, {}, {
                                      headers: { Authorization: `Bearer ${userInfo?.token}` }
                                    });
                                    toast.success("Royalty request sent! Waiting for admin approval.");
                                    refetch();
                                  } catch (e) {
                                    toast.error("Failed to send request");
                                  }
                                }}
                                className="w-full text-left px-4 py-3 text-xs font-medium hover:bg-zinc-700 text-yellow-500 flex items-center gap-2 border-t border-zinc-700/50"
                              >
                                💰 Request Royalty
                              </button>
                            )}

                            {/* Re-Request (Rejected/Draft) */}
                            {req.is3D && (req.status === "Rejected" || req.status === "Draft") && (
                              <button
                                onClick={() => { setLoadingId(req.id); rerequestMutation.mutate(req.id); setOpenMenuId(null); }}
                                disabled={loadingId === req.id}
                                className="w-full text-left px-4 py-3 text-xs font-medium hover:bg-zinc-700 text-blue-400 flex items-center gap-2"
                              >
                                <CheckCircle size={14} /> Submit Request
                              </button>
                            )}

                            {/* Delete Actions */}
                            <div className="h-px bg-zinc-700/50 my-1" />

                            {/* Rename */}
                            <button
                              onClick={() => { setRenameModal({ open: true, designId: req.id, currentName: req.name, newName: req.name }); setOpenMenuId(null); }}
                              className="w-full text-left px-4 py-3 text-xs font-medium hover:bg-zinc-700 text-gray-300 flex items-center gap-2"
                            >
                              <Pencil size={14} /> Rename
                            </button>

                            {/* Permanently Delete */}
                            <button
                              onClick={() => {
                                if (confirm("Permanently delete this design?")) {
                                  setLoadingId(req.id); deleteMutation.mutate(req.id);
                                }
                              }}
                              className="w-full text-left px-4 py-3 text-xs font-medium hover:bg-red-900/30 text-red-500 flex items-center gap-2"
                            >
                              <Trash2 size={14} /> Delete Design
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {(!requests || requests.length === 0) && (
            <div className="col-span-full text-center py-20 text-gray-500">
              No custom requests yet. Start designing.
            </div>
          )}
        </div>
      </div>

      {/* Rejection Reason Modal */}
      {rejectionModal.open && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setRejectionModal({ open: false, reason: "", name: "" })}>
          <div className="bg-zinc-900 border border-red-800/50 rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-red-400 mb-2">Rejection Reason</h3>
            <p className="text-gray-400 text-sm mb-4">For: {rejectionModal.name}</p>
            <div className="bg-black/50 rounded p-4 border border-red-900/30">
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{rejectionModal.reason}</p>
            </div>
            <button
              onClick={() => setRejectionModal({ open: false, reason: "", name: "" })}
              className="w-full mt-4 bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded font-bold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Cart Modal - Size/Quantity Selection */}
      {cartModal.open && cartModal.design && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setCartModal({ open: false, design: null, size: "L", qty: 1 })}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            {/* Design Preview */}
            <div className="flex gap-4 mb-6">
              <div className="w-24 h-24 bg-zinc-800 rounded overflow-hidden flex-shrink-0">
                {cartModal.design.previewImage && (
                  <img src={cartModal.design.previewImage} alt={cartModal.design.name} className="w-full h-full object-cover" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{cartModal.design.name}</h3>
                <p className="text-gray-400 text-sm">{cartModal.design.tshirtType === "oversized" ? "Oversized T-Shirt" : "Regular T-Shirt"}</p>
                <p className="text-red-500 font-bold text-lg mt-1">₹{cartModal.design.tshirtType === "oversized" ? 1199 : 999}</p>
              </div>
            </div>

            {/* Size Selection */}
            <div className="mb-6">
              <p className="text-gray-400 text-sm mb-3 uppercase tracking-wider">Select Size</p>
              <div className="flex gap-2">
                {["S", "M", "L", "XL"].map((size) => (
                  <button
                    key={size}
                    onClick={() => setCartModal({ ...cartModal, size })}
                    className={`w-12 h-12 border rounded font-bold transition-colors ${cartModal.size === size
                      ? "bg-red-600 border-red-600 text-white"
                      : "border-zinc-600 text-gray-400 hover:border-white hover:text-white"
                      }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Selection */}
            <div className="mb-6">
              <p className="text-gray-400 text-sm mb-3 uppercase tracking-wider">Quantity</p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCartModal({ ...cartModal, qty: Math.max(1, cartModal.qty - 1) })}
                  className="w-10 h-10 border border-zinc-600 rounded text-white hover:bg-zinc-800 transition-colors"
                >
                  -
                </button>
                <span className="text-white font-bold text-xl w-8 text-center">{cartModal.qty}</span>
                <button
                  onClick={() => setCartModal({ ...cartModal, qty: cartModal.qty + 1 })}
                  className="w-10 h-10 border border-zinc-600 rounded text-white hover:bg-zinc-800 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setCartModal({ open: false, design: null, size: "L", qty: 1 })}
                className="flex-1 border border-zinc-600 text-gray-400 py-3 rounded font-bold hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={confirmAddToCart}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded font-bold flex items-center justify-center gap-2"
              >
                <ShoppingCart size={18} /> Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {renameModal.open && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Rename Design</h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Current Name</label>
                <p className="text-white font-medium">{renameModal.currentName}</p>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">New Name</label>
                <input
                  type="text"
                  value={renameModal.newName}
                  onChange={(e) => setRenameModal({ ...renameModal, newName: e.target.value })}
                  className="w-full bg-black border border-zinc-700 py-2 px-3 rounded text-white focus:border-purple-500 outline-none"
                  placeholder="Enter new name..."
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setRenameModal({ open: false, designId: "", currentName: "", newName: "" })}
                className="flex-1 border border-zinc-600 text-gray-400 py-2 rounded font-bold hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={() => renameMutation.mutate({ id: renameModal.designId, name: renameModal.newName })}
                disabled={!renameModal.newName.trim() || renameModal.newName === renameModal.currentName || renameMutation.isPending}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white py-2 rounded font-bold flex items-center justify-center gap-2"
              >
                {renameMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Pencil size={16} />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Royalty Info Modal */}
      {royaltyInfoModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200" onClick={() => setRoyaltyInfoModal(false)}>
          <div className="bg-zinc-900 border border-yellow-600/30 rounded-xl p-6 w-full max-w-sm relative shadow-2xl scale-100 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setRoyaltyInfoModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <XCircle size={20} />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-yellow-500/10 p-3 rounded-full">
                <AlertTriangle className="text-yellow-500" size={24} />
              </div>
              <h3 className="text-xl font-bold text-white">Make Public?</h3>
            </div>

            <p className="text-gray-300 text-sm mb-4 leading-relaxed">
              Does DropXCult want to officially sell your design?
            </p>

            <div className="space-y-3">
              <div className="bg-black/40 border border-green-900/30 p-3 rounded-lg flex gap-3">
                <CheckCircle className="text-green-500 shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-green-400 font-bold text-sm">Accept</p>
                  <p className="text-gray-400 text-xs">We sell it in the Store. You earn a <span className="text-white font-semibold">Royalty Commission</span> on every sale.</p>
                </div>
              </div>

              <div className="bg-black/40 border border-red-900/30 p-3 rounded-lg flex gap-3">
                <XCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-red-400 font-bold text-sm">Reject</p>
                  <p className="text-gray-400 text-xs">Remains your private creation. It will <span className="text-white font-semibold">NOT</span> be sold or listed.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setRoyaltyInfoModal(false)}
              className="w-full mt-6 bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}