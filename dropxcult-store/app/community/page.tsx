"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Loader2, Trophy, Flame, Heart, MessageCircle, Share2, User, Crown, Users, TrendingUp, Clock, Award, Eye, ShoppingCart } from "lucide-react";
import { useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import { addToCart } from "@/redux/slices/cartSlice";
import { toast } from "sonner";

export default function CommunityPage() {
    const { userInfo } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch();
    const queryClient = useQueryClient();

    const [leaderboardFilter, setLeaderboardFilter] = useState("creators");
    const [period, setPeriod] = useState("alltime");
    const [sort, setSort] = useState("latest");
    const [selectedDesign, setSelectedDesign] = useState<any>(null);
    const [commentText, setCommentText] = useState("");
    const [likedDesigns, setLikedDesigns] = useState<Set<string>>(new Set());
    const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
    const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
    const commentInputRef = useRef<HTMLInputElement>(null);

    // Fetch community data
    const { data, isLoading } = useQuery({
        queryKey: ["community", leaderboardFilter, period, sort],
        queryFn: async () => {
            const { data } = await axios.get(`/api/community?filter=${leaderboardFilter}&period=${period}&sort=${sort}`, {
                headers: userInfo?.token ? { Authorization: `Bearer ${userInfo.token}` } : {}
            });
            // Initialize liked state from API response
            if (data.feed) {
                const liked = new Set<string>();
                data.feed.forEach((d: any) => {
                    if (d.likedByUser) liked.add(d.id);
                });
                setLikedDesigns(liked);
            }
            return data;
        },
    });

    // Like mutation
    const likeMutation = useMutation({
        mutationFn: async (designId: string) => {
            const { data } = await axios.post(`/api/designs/${designId}/like`, {}, {
                headers: { Authorization: `Bearer ${userInfo?.token}` }
            });
            return { ...data, designId };
        },
        onSuccess: (data) => {
            // Toggle liked state
            setLikedDesigns(prev => {
                const newSet = new Set(prev);
                if (data.liked) {
                    newSet.add(data.designId);
                } else {
                    newSet.delete(data.designId);
                }
                return newSet;
            });
            queryClient.invalidateQueries({ queryKey: ["community"] });
        },
        onError: () => toast.error("Please login to like")
    });

    // Comment mutation (supports replies via parentId)
    const commentMutation = useMutation({
        mutationFn: async ({ designId, content, parentId }: { designId: string; content: string; parentId?: string }) => {
            const { data } = await axios.post(`/api/designs/${designId}/comments`, { content, parentId }, {
                headers: { Authorization: `Bearer ${userInfo?.token}` }
            });
            return data;
        },
        onSuccess: () => {
            setCommentText("");
            setReplyingTo(null);
            queryClient.invalidateQueries({ queryKey: ["comments"] });
            queryClient.invalidateQueries({ queryKey: ["community"] });
            toast.success("Comment added!");
        },
        onError: () => toast.error("Please login to comment")
    });

    // Fetch comments for selected design
    const { data: comments } = useQuery({
        queryKey: ["comments", selectedDesign?.id],
        queryFn: async () => {
            if (!selectedDesign?.id) return [];
            const { data } = await axios.get(`/api/designs/${selectedDesign.id}/comments`);
            return data;
        },
        enabled: !!selectedDesign?.id && selectedDesign?.is3D
    });

    // Follow mutation
    const followMutation = useMutation({
        mutationFn: async (userId: string) => {
            const { data } = await axios.post(`/api/users/${userId}/follow`, {}, {
                headers: { Authorization: `Bearer ${userInfo?.token}` }
            });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["community"] });
        },
        onError: () => toast.error("Please login to follow")
    });

    // Comment like mutation
    const commentLikeMutation = useMutation({
        mutationFn: async (commentId: string) => {
            const { data } = await axios.post(`/api/comments/${commentId}/like`, {}, {
                headers: { Authorization: `Bearer ${userInfo?.token}` }
            });
            return { ...data, commentId };
        },
        onSuccess: (data) => {
            // Update local state based on response
            setLikedComments(prev => {
                const newSet = new Set(prev);
                if (data.liked) {
                    newSet.add(data.commentId);
                } else {
                    newSet.delete(data.commentId);
                }
                return newSet;
            });
            queryClient.invalidateQueries({ queryKey: ["comments"] });
        },
        onError: () => toast.error("Please login to like")
    });

    // Share handler
    const handleShare = async (design: any) => {
        const url = `${window.location.origin}/community?design=${design.id}`;
        try {
            await navigator.clipboard.writeText(url);
            toast.success("Link copied!");
            if (design.is3D) {
                axios.post(`/api/designs/${design.id}/share`);
            }
        } catch {
            toast.error("Failed to copy link");
        }
    };

    // Handle buy/add to cart for 3D designs
    const handleBuyDesign = (design: any) => {
        if (!userInfo) {
            toast.error("Please login to purchase");
            return;
        }

        dispatch(addToCart({
            id: design.id,
            name: design.name,
            slug: `design-${design.id}`,
            price: 999, // Default price for community designs
            image: design.previewImage || "",
            size: "M",
            qty: 1,
            isCustom: true,
            designId: design.id
        }));
        toast.success(`${design.name} added to cart!`);
    };

    const getRankColor = (rank: string) => {
        switch (rank) {
            case "Founder": return "text-yellow-500 border-yellow-500 bg-yellow-900/30";
            case "Elder": return "text-purple-500 border-purple-500 bg-purple-900/30";
            case "Zealot": return "text-red-500 border-red-500 bg-red-900/30";
            case "Apostle": return "text-orange-500 border-orange-500 bg-orange-900/30";
            case "Disciple": return "text-blue-500 border-blue-500 bg-blue-900/30";
            default: return "text-gray-400 border-gray-600 bg-gray-800";
        }
    };

    if (isLoading) return <div className="h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-red-600" size={32} /></div>;

    return (
        <div className="min-h-screen bg-black text-white pt-4 pb-12">
            <div className="container mx-auto px-4 max-w-7xl">

                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter mb-2 text-red-600">THE CULT</h1>
                    <p className="text-gray-400 text-sm">Where legends are forged and designs become mythology.</p>
                </div>

                {/* Leaderboard */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 sm:p-6 mb-6">
                    <div className="flex flex-col gap-4 mb-4">
                        {/* Title + Filters Row */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <Trophy className="text-yellow-500" size={20} /> Top Creators
                            </h2>

                            {/* Leaderboard Type Toggle */}
                            <div className="flex bg-black rounded p-1 border border-zinc-800">
                                <button
                                    onClick={() => setLeaderboardFilter("creators")}
                                    className={`px-3 py-1.5 text-xs font-bold rounded transition ${leaderboardFilter === "creators" ? "bg-red-600/20 text-red-400" : "text-gray-500 hover:text-gray-300"}`}
                                >
                                    <Users size={14} className="inline mr-1" /> Creators
                                </button>
                                <button
                                    onClick={() => setLeaderboardFilter("collectors")}
                                    className={`px-3 py-1.5 text-xs font-bold rounded transition ${leaderboardFilter === "collectors" ? "bg-red-600/20 text-red-400" : "text-gray-500 hover:text-gray-300"}`}
                                >
                                    <Award size={14} className="inline mr-1" /> Collectors
                                </button>
                            </div>
                        </div>

                        {/* Period Filter */}
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                            {[
                                { value: "weekly", label: "This Week", icon: Clock },
                                { value: "monthly", label: "This Month", icon: TrendingUp },
                                { value: "alltime", label: "All Time", icon: Crown }
                            ].map((p) => (
                                <button
                                    key={p.value}
                                    onClick={() => setPeriod(p.value)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full transition whitespace-nowrap ${period === p.value
                                        ? "bg-gradient-to-r from-red-600 to-orange-600 text-white"
                                        : "bg-zinc-800 text-gray-400 hover:bg-zinc-700"
                                        }`}
                                >
                                    <p.icon size={12} /> {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Leaderboard Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {data?.leaderboard?.map((user: any, index: number) => (
                            <div key={user.id || index} className="relative p-3 bg-black/50 rounded-lg border border-zinc-800/50 hover:border-red-900/50 transition group">
                                {index < 3 && (
                                    <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? "bg-yellow-500 text-black" :
                                        index === 1 ? "bg-gray-400 text-black" :
                                            "bg-orange-700 text-white"
                                        }`}>
                                        {index + 1}
                                    </div>
                                )}
                                <div className="flex flex-col items-center text-center">
                                    <div className="h-12 w-12 rounded-full bg-zinc-800 overflow-hidden border-2 border-zinc-700 mb-2">
                                        {user.image ? (
                                            <img src={user.image} className="h-full w-full object-cover" alt={user.name} />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-gray-600">
                                                <User size={20} />
                                            </div>
                                        )}
                                    </div>
                                    <p className="font-bold text-sm truncate w-full">{user.name}</p>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded border mt-1 ${getRankColor(user.rank)}`}>
                                        {user.rank}
                                    </span>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {leaderboardFilter === "creators"
                                            ? `${user.followersCount || 0} followers`
                                            : `${user.ordersCount || 0} orders`
                                        }
                                    </p>
                                    {userInfo && user.id !== userInfo._id && (
                                        <button
                                            onClick={() => followMutation.mutate(user.id)}
                                            className="mt-2 px-3 py-1 text-[10px] font-bold rounded-full bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white transition"
                                        >
                                            Follow
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {(!data?.leaderboard || data.leaderboard.length === 0) && (
                            <div className="col-span-full py-8 text-center text-gray-500 text-sm">
                                No creators to show yet. Be the first!
                            </div>
                        )}
                    </div>
                </div>

                {/* Feed Section */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <Flame className="text-red-500" size={20} /> Community Feed
                        </h2>

                        {/* Sort Toggle */}
                        <div className="flex bg-zinc-900 rounded p-1 border border-zinc-800">
                            {[
                                { value: "latest", label: "Latest" },
                                { value: "trending", label: "Trending" },
                                { value: "popular", label: "Popular" }
                            ].map((s) => (
                                <button
                                    key={s.value}
                                    onClick={() => setSort(s.value)}
                                    className={`px-3 py-1 text-xs font-bold rounded transition ${sort === s.value ? "bg-zinc-800 text-white" : "text-gray-500 hover:text-gray-300"
                                        }`}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Design Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data?.feed?.map((design: any) => (
                            <div key={design.id} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden group hover:border-red-900/50 transition-all duration-300">
                                {/* Image */}
                                <div className="aspect-square bg-black relative overflow-hidden">
                                    {design.previewImage ? (
                                        <img
                                            src={design.previewImage}
                                            alt={design.name}
                                            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">
                                            No Image
                                        </div>
                                    )}
                                    {design.is3D && (
                                        <span className="absolute top-2 left-2 px-2 py-0.5 bg-purple-600 text-white text-[10px] font-bold rounded">
                                            3D
                                        </span>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-3">
                                    {/* Creator Info */}
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden flex-shrink-0">
                                            {design.user?.image ? (
                                                <img src={design.user.image} className="w-full h-full object-cover" alt={design.user.name} />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-500">
                                                    <User size={14} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold truncate">{design.user?.name || "Unknown"}</p>
                                            <span className={`text-[9px] px-1 py-0.5 rounded border ${getRankColor(design.user?.rank)}`}>
                                                {design.user?.rank || "Initiate"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Design Name */}
                                    <h3 className="font-bold text-sm text-white mb-2 truncate">{design.name}</h3>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-4 pt-2 border-t border-zinc-800">
                                        {/* Like */}
                                        <button
                                            onClick={() => design.is3D && likeMutation.mutate(design.id)}
                                            disabled={!design.is3D}
                                            className={`flex items-center gap-1 text-sm transition ${!design.is3D
                                                ? "text-gray-600 cursor-not-allowed"
                                                : likedDesigns.has(design.id)
                                                    ? "text-red-500"
                                                    : "text-gray-400 hover:text-red-500"
                                                }`}
                                        >
                                            <Heart size={18} className={likedDesigns.has(design.id) ? "fill-red-500" : ""} />
                                            <span className="text-xs">{design.likesCount || 0}</span>
                                        </button>

                                        {/* Comment */}
                                        <button
                                            onClick={() => design.is3D && setSelectedDesign(design)}
                                            disabled={!design.is3D}
                                            className={`flex items-center gap-1 text-sm transition ${design.is3D ? "text-gray-400 hover:text-blue-500" : "text-gray-600 cursor-not-allowed"
                                                }`}
                                        >
                                            <MessageCircle size={18} />
                                            <span className="text-xs">{design.commentsCount || 0}</span>
                                        </button>

                                        {/* Share */}
                                        <button
                                            onClick={() => handleShare(design)}
                                            className="flex items-center gap-1 text-sm text-gray-400 hover:text-green-500 transition"
                                        >
                                            <Share2 size={18} />
                                        </button>

                                        {/* View 3D - Only for 3D designs */}
                                        {design.is3D && (
                                            <a
                                                href={`${process.env.NEXT_PUBLIC_EDITOR_URL || 'http://localhost:3000'}?designId=${design.id}&viewOnly=true`}
                                                target="_blank"
                                                className="flex items-center gap-1 text-sm text-gray-400 hover:text-purple-500 transition"
                                            >
                                                <Eye size={18} />
                                            </a>
                                        )}

                                        {/* Buy Button - For 3D designs */}
                                        {design.is3D && (
                                            <button
                                                onClick={() => handleBuyDesign(design)}
                                                className="flex items-center gap-1 text-sm text-gray-400 hover:text-yellow-500 transition ml-auto"
                                                title="Add to Cart"
                                            >
                                                <ShoppingCart size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {(!data?.feed || data.feed.length === 0) && (
                            <div className="col-span-full py-16 text-center text-gray-500">
                                <Flame size={48} className="mx-auto mb-4 opacity-30" />
                                <p>No public designs yet. Be the first to drop one!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Comments Modal - Instagram Style */}
            {selectedDesign && (
                <div className="fixed inset-0 bg-black/90 flex items-end sm:items-center justify-center z-50" onClick={() => setSelectedDesign(null)}>
                    <div
                        className="bg-[#262626] w-full sm:w-full sm:max-w-md h-[85vh] sm:h-[80vh] sm:rounded-xl flex flex-col overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-center p-4 border-b border-zinc-700 relative">
                            <h3 className="font-semibold text-white text-base">Comments</h3>
                            <button
                                onClick={() => setSelectedDesign(null)}
                                className="absolute right-4 text-gray-400 hover:text-white text-xl"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Comments List */}
                        <div className="flex-1 overflow-y-auto">
                            {comments?.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                    <MessageCircle size={48} className="mb-4 opacity-30" />
                                    <p className="text-lg font-semibold">No comments yet</p>
                                    <p className="text-sm">Start the conversation.</p>
                                </div>
                            )}

                            {comments?.map((comment: any) => {
                                // Calculate relative time
                                const getTimeAgo = (date: string) => {
                                    const now = new Date();
                                    const commentDate = new Date(date);
                                    const diffMs = now.getTime() - commentDate.getTime();
                                    const diffMins = Math.floor(diffMs / 60000);
                                    const diffHours = Math.floor(diffMs / 3600000);
                                    const diffDays = Math.floor(diffMs / 86400000);
                                    const diffWeeks = Math.floor(diffDays / 7);

                                    if (diffMins < 1) return "now";
                                    if (diffMins < 60) return `${diffMins}m`;
                                    if (diffHours < 24) return `${diffHours}h`;
                                    if (diffDays < 7) return `${diffDays}d`;
                                    return `${diffWeeks}w`;
                                };

                                return (
                                    <div key={comment.id}>
                                        <div className="flex gap-3 px-4 py-3 hover:bg-zinc-800/30">
                                            {/* Avatar */}
                                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-[2px] flex-shrink-0">
                                                <div className="h-full w-full rounded-full bg-[#262626] flex items-center justify-center overflow-hidden">
                                                    {comment.user?.image ? (
                                                        <img src={comment.user.image} className="w-full h-full object-cover" alt="" />
                                                    ) : (
                                                        <span className="text-white text-sm font-semibold">
                                                            {comment.user?.name?.charAt(0)?.toUpperCase() || "U"}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Comment Content */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm leading-relaxed">
                                                    <span className="font-semibold text-white mr-1">{comment.user?.name}</span>
                                                    <span className="text-gray-200">{comment.content}</span>
                                                </p>
                                                <div className="flex items-center gap-3 mt-1.5">
                                                    <span className="text-xs text-gray-500">{getTimeAgo(comment.createdAt)}</span>
                                                    <button
                                                        onClick={() => {
                                                            setReplyingTo({ id: comment.id, name: comment.user?.name });
                                                            setCommentText(`@${comment.user?.name} `);
                                                            commentInputRef.current?.focus();
                                                        }}
                                                        className="text-xs text-gray-500 font-semibold hover:text-gray-300"
                                                    >
                                                        Reply
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Like Button */}
                                            <button
                                                onClick={() => commentLikeMutation.mutate(comment.id)}
                                                className={`flex-shrink-0 p-1 flex flex-col items-center transition ${likedComments.has(comment.id) ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                                            >
                                                <Heart size={14} className={likedComments.has(comment.id) ? 'fill-red-500' : ''} />
                                                {comment.likesCount > 0 && (
                                                    <span className="text-[10px] mt-0.5">{comment.likesCount}</span>
                                                )}
                                            </button>
                                        </div>

                                        {/* Nested Replies */}
                                        {comment.replies && comment.replies.length > 0 && (
                                            <div className="ml-12 border-l border-zinc-700/50">
                                                {comment.replies.map((reply: any) => (
                                                    <div key={reply.id} className="flex gap-3 px-4 py-2 hover:bg-zinc-800/20">
                                                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 p-[2px] flex-shrink-0">
                                                            <div className="h-full w-full rounded-full bg-[#262626] flex items-center justify-center overflow-hidden">
                                                                {reply.user?.image ? (
                                                                    <img src={reply.user.image} className="w-full h-full object-cover" alt="" />
                                                                ) : (
                                                                    <span className="text-white text-xs font-semibold">
                                                                        {reply.user?.name?.charAt(0)?.toUpperCase() || "U"}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm leading-relaxed">
                                                                <span className="font-semibold text-white mr-1">{reply.user?.name}</span>
                                                                <span className="text-gray-300">{reply.content}</span>
                                                            </p>
                                                            <span className="text-xs text-gray-500">{getTimeAgo(reply.createdAt)}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Bottom Input Bar */}
                        <div className="border-t border-zinc-700 bg-[#262626]">
                            {userInfo ? (
                                <div className="flex items-center gap-3 p-4">
                                    {/* User Avatar */}
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 p-[2px] flex-shrink-0">
                                        <div className="h-full w-full rounded-full bg-[#262626] flex items-center justify-center">
                                            <span className="text-white text-xs font-semibold">
                                                {userInfo.name?.charAt(0)?.toUpperCase() || "U"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Input */}
                                    <input
                                        ref={commentInputRef}
                                        type="text"
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && commentText.trim()) {
                                                commentMutation.mutate({ designId: selectedDesign.id, content: commentText, parentId: replyingTo?.id });
                                            }
                                        }}
                                        placeholder={replyingTo ? `Replying to @${replyingTo.name}...` : `Add a comment...`}
                                        className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
                                    />

                                    {/* Cancel Reply */}
                                    {replyingTo && (
                                        <button
                                            onClick={() => { setReplyingTo(null); setCommentText(''); }}
                                            className="text-gray-500 text-xs hover:text-white"
                                        >
                                            ✕
                                        </button>
                                    )}

                                    {/* Post Button */}
                                    <button
                                        onClick={() => commentMutation.mutate({ designId: selectedDesign.id, content: commentText, parentId: replyingTo?.id })}
                                        disabled={!commentText.trim() || commentMutation.isPending}
                                        className="text-blue-500 font-semibold text-sm hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                                    >
                                        {commentMutation.isPending ? "..." : "Post"}
                                    </button>
                                </div>
                            ) : (
                                <div className="p-4 text-center">
                                    <p className="text-gray-500 text-sm">
                                        <a href="/login" className="text-blue-500 hover:underline">Log in</a> to comment
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}