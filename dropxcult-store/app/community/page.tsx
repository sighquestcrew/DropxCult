"use client";


import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Loader2, Trophy, Flame, Heart, MessageCircle, Share2, User, Crown, Users, TrendingUp, Clock, Award, Eye, ShoppingCart, Search, Sparkles, ChevronDown, Plus, X, ShoppingBag, Bookmark } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import { addToCart } from "@/redux/slices/cartSlice";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CommentSection from "@/components/community/CommentSection";
import { toggleWishlist, isInWishlist, WishlistItem, getWishlist } from "@/lib/wishlist";

export default function CommunityPage() {
    const { userInfo } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch();
    const queryClient = useQueryClient();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<"foryou" | "following" | "trending">("foryou");
    const [period, setPeriod] = useState("alltime");
    const [selectedDesign, setSelectedDesign] = useState<any>(null);
    const [commentText, setCommentText] = useState("");
    const [likedDesigns, setLikedDesigns] = useState<Set<string>>(new Set());
    const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
    const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
    const commentInputRef = useRef<HTMLInputElement>(null);
    const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
    const [mobileView, setMobileView] = useState<"search" | "trending" | "creators" | null>(null);
    const [bookmarkedDesigns, setBookmarkedDesigns] = useState<Set<string>>(new Set());

    // Load bookmarked designs from localStorage
    useEffect(() => {
        const wishlist = getWishlist();
        setBookmarkedDesigns(new Set(wishlist.map(item => item.id)));
    }, []);

    // Handle bookmark toggle
    const handleBookmark = (design: any) => {
        const wishlistItem: WishlistItem = {
            id: design.id,
            name: design.name,
            price: 999,
            image: design.previewImage || "",
            slug: `design-${design.id}`,
            sizes: ["S", "M", "L", "XL", "XXL"],
            category: design.garmentType || "T-Shirt" // Use design's garment type
        };
        const isAdded = toggleWishlist(wishlistItem);
        setBookmarkedDesigns(prev => {
            const newSet = new Set(prev);
            if (isAdded) {
                newSet.add(design.id);
                toast.success("Saved to wishlist!");
            } else {
                newSet.delete(design.id);
                toast.success("Removed from wishlist");
            }
            return newSet;
        });
    };

    // Search state
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    // Fetch community data
    const { data, isLoading } = useQuery({
        queryKey: ["community", activeTab, period],
        queryFn: async () => {
            const sort = activeTab === "trending" ? "trending" : activeTab === "foryou" ? "popular" : "latest";
            const { data } = await axios.get(`/api/community?filter=creators&period=${period}&sort=${sort}&tab=${activeTab}`, {
                headers: userInfo?.token ? { Authorization: `Bearer ${userInfo.token}` } : {}
            });
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
            setLikedDesigns(prev => {
                const newSet = new Set(prev);
                if (data.liked) newSet.add(data.designId);
                else newSet.delete(data.designId);
                return newSet;
            });
            queryClient.invalidateQueries({ queryKey: ["community"] });
        },
        onError: () => toast.error("Please login to like")
    });

    // Follow mutation
    const followMutation = useMutation({
        mutationFn: async (userId: string) => {
            const { data } = await axios.post(`/api/users/${userId}/follow`, {}, {
                headers: { Authorization: `Bearer ${userInfo?.token}` }
            });
            return data;
        },
        onSuccess: (data) => {
            toast.success(data.followed ? "Followed!" : "Unfollowed");
            queryClient.invalidateQueries({ queryKey: ["community"] });
        },
        onError: () => toast.error("Please login to follow")
    });

    // Comment mutation
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

    // Fetch comments
    const { data: comments } = useQuery({
        queryKey: ["comments", selectedDesign?.id],
        queryFn: async () => {
            if (!selectedDesign?.id) return [];
            const { data } = await axios.get(`/api/designs/${selectedDesign.id}/comments`);
            return data;
        },
        enabled: !!selectedDesign?.id && selectedDesign?.is3D
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
            setLikedComments(prev => {
                const newSet = new Set(prev);
                if (data.liked) newSet.add(data.commentId);
                else newSet.delete(data.commentId);
                return newSet;
            });
            queryClient.invalidateQueries({ queryKey: ["comments"] });
        },
        onError: () => toast.error("Please login to like")
    });

    const handleShare = async (design: any) => {
        const url = `${window.location.origin}/community?design=${design.id}`;
        try {
            await navigator.clipboard.writeText(url);
            toast.success("Link copied!");
            if (design.is3D) axios.post(`/api/designs/${design.id}/share`);
        } catch {
            toast.error("Failed to copy link");
        }
    };

    const handleBuyDesign = (design: any) => {
        if (!userInfo) {
            toast.error("Please login to purchase");
            return;
        }
        dispatch(addToCart({
            id: design.id,
            name: design.name,
            slug: `design-${design.id}`,
            price: 999,
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
            case "Founder": return "text-yellow-500 bg-yellow-500/10";
            case "Elder": return "text-purple-500 bg-purple-500/10";
            case "Zealot": return "text-red-500 bg-red-500/10";
            case "Apostle": return "text-orange-500 bg-orange-500/10";
            case "Disciple": return "text-blue-500 bg-blue-500/10";
            default: return "text-gray-400 bg-gray-500/10";
        }
    };

    const getTimeAgo = (date: string) => {
        const now = new Date();
        const d = new Date(date);
        const diffMs = now.getTime() - d.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        if (diffMins < 1) return "now";
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;
        return `${Math.floor(diffDays / 7)}w`;
    };

    if (isLoading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-500" size={32} />
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white overflow-x-hidden">
            <div className="max-w-7xl mx-auto flex">

                {/* Main Feed - Center */}
                <main className="flex-1 min-w-0 border-0 sm:border-x border-zinc-800 min-h-screen">
                    {/* Header Tabs */}
                    <div className="sticky top-0 bg-black/80 backdrop-blur-md z-40 border-b border-zinc-800">
                        <div className="flex">
                            {[
                                { id: "foryou", label: "For you" },
                                { id: "following", label: "Following" },
                                { id: "trending", label: "Trending" }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex-1 py-4 text-sm font-semibold transition-colors relative hover:bg-zinc-900 ${activeTab === tab.id ? "text-white" : "text-gray-500"
                                        }`}
                                >
                                    {tab.label}
                                    {activeTab === tab.id && (
                                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-blue-500 rounded-full" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Period Filter */}
                    <div className="p-4 border-b border-zinc-800">
                        {/* Mobile Dropdown */}
                        <div className="block sm:hidden relative">
                            <button
                                onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
                                className="w-full bg-zinc-900 border border-zinc-700 text-white py-2 pl-4 pr-10 rounded-lg text-left flex items-center justify-between"
                            >
                                <span className="capitalize">
                                    {period === "daily" ? "Today" : period === "weekly" ? "This Week" : period === "monthly" ? "This Month" : "All Time"}
                                </span>
                                <ChevronDown size={16} className={`text-gray-400 transition-transform ${isPeriodDropdownOpen ? "rotate-180" : ""}`} />
                            </button>

                            {isPeriodDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsPeriodDropdownOpen(false)} />
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-20 overflow-hidden">
                                        {[
                                            { value: "daily", label: "Today" },
                                            { value: "weekly", label: "This Week" },
                                            { value: "monthly", label: "This Month" },
                                            { value: "alltime", label: "All Time" }
                                        ].map((p) => (
                                            <button
                                                key={p.value}
                                                onClick={() => {
                                                    setPeriod(p.value);
                                                    setIsPeriodDropdownOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-3 text-sm transition ${period === p.value
                                                    ? "bg-zinc-800 text-blue-500 font-bold"
                                                    : "text-gray-300 hover:bg-zinc-800 hover:text-white"
                                                    }`}
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Desktop Tabs */}
                        <div className="hidden sm:flex gap-2 overflow-x-auto">
                            {[
                                { value: "daily", label: "Today" },
                                { value: "weekly", label: "This Week" },
                                { value: "monthly", label: "This Month" },
                                { value: "alltime", label: "All Time" }
                            ].map((p) => (
                                <button
                                    key={p.value}
                                    onClick={() => setPeriod(p.value)}
                                    className={`px-4 py-1.5 text-sm font-medium rounded-full transition whitespace-nowrap ${period === p.value
                                        ? "bg-white text-black"
                                        : "bg-zinc-800 text-gray-400 hover:bg-zinc-700"
                                        }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>



                    {/* Design Feed */}
                    <div className="divide-y divide-zinc-800">
                        {data?.feed?.map((design: any) => (
                            <article key={design.id} className="p-2 sm:p-4 hover:bg-zinc-900/50 transition">
                                {/* Creator Info Header */}
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <Link href={`/user/${design.user?.id}`} className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-[2px] flex-shrink-0 hover:opacity-80 transition">
                                        <div className="h-full w-full rounded-full bg-zinc-900 flex items-center justify-center overflow-hidden">
                                            {design.user?.image ? (
                                                <img src={design.user.image} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                <User size={16} className="text-gray-500" />
                                            )}
                                        </div>
                                    </Link>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Link href={`/user/${design.user?.id}`} className="font-bold truncate hover:underline">
                                                {design.user?.name || "Unknown"}
                                            </Link>
                                            <span className={`text-xs px-1.5 py-0.5 rounded ${getRankColor(design.user?.rank)}`}>
                                                {design.user?.rank || "Initiate"}
                                            </span>
                                            <span className="text-gray-500 text-sm">· {getTimeAgo(design.createdAt)}</span>
                                        </div>
                                        {/* Design Name */}
                                        <p className="text-gray-100 mt-1">{design.name}</p>
                                    </div>
                                </div>

                                {/* Design Image - Full width, centered */}
                                {design.previewImage && (
                                    <div className="mt-3 rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 flex justify-center">
                                        <img
                                            src={design.previewImage}
                                            alt={design.name}
                                            className="max-w-full max-h-[280px] sm:max-h-[300px] object-contain"
                                        />
                                    </div>
                                )}

                                {/* Tags - Full width */}
                                <div className="flex gap-2 mt-3">
                                    {design.is3D && (
                                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">3D Design</span>
                                    )}
                                    {design.tshirtType && (
                                        <span className="px-2 py-0.5 bg-zinc-800 text-gray-400 text-xs rounded-full">{design.tshirtType}</span>
                                    )}
                                </div>

                                {/* Actions - Full width */}
                                <div className="mt-4 space-y-3">
                                    {/* Social actions */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 sm:gap-4">
                                            <button
                                                onClick={() => design.is3D && setSelectedDesign(design)}
                                                className="flex items-center gap-1.5 text-gray-500 hover:text-blue-500 transition p-1.5 sm:p-2 rounded-full hover:bg-blue-500/10"
                                            >
                                                <MessageCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
                                                <span className="text-xs sm:text-sm">{design.commentsCount || 0}</span>
                                            </button>

                                            <button
                                                onClick={() => design.is3D && likeMutation.mutate(design.id)}
                                                className={`flex items-center gap-1.5 transition p-1.5 sm:p-2 rounded-full hover:bg-red-500/10 ${likedDesigns.has(design.id) ? "text-red-500" : "text-gray-500 hover:text-red-500"
                                                    }`}
                                            >
                                                <Heart size={16} className={`sm:w-[18px] sm:h-[18px] ${likedDesigns.has(design.id) ? "fill-red-500" : ""}`} />
                                                <span className="text-xs sm:text-sm">{design.likesCount || 0}</span>
                                            </button>

                                            <button
                                                onClick={() => handleShare(design)}
                                                className="flex items-center gap-1.5 text-gray-500 hover:text-green-500 transition p-1.5 sm:p-2 rounded-full hover:bg-green-500/10"
                                            >
                                                <Share2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                                                <span className="text-xs sm:text-sm">{design.sharesCount || 0}</span>
                                            </button>
                                        </div>

                                        {/* Bookmark Button - Right side */}
                                        <button
                                            onClick={() => handleBookmark(design)}
                                            className={`flex items-center gap-1.5 transition p-1.5 sm:p-2 rounded-full hover:bg-yellow-500/10 ${bookmarkedDesigns.has(design.id) ? "text-yellow-500" : "text-gray-500 hover:text-yellow-500"
                                                }`}
                                        >
                                            <Bookmark size={16} className={`sm:w-[18px] sm:h-[18px] ${bookmarkedDesigns.has(design.id) ? "fill-yellow-500" : ""}`} />
                                        </button>
                                    </div>

                                    {/* Buy/View buttons - separate row */}
                                    {design.is3D && (
                                        <div className="flex gap-2">
                                            <a
                                                href={`${process.env.NEXT_PUBLIC_EDITOR_URL || 'http://localhost:3000'}?designId=${design.id}&viewOnly=true`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-lg font-medium transition"
                                            >
                                                <Eye size={16} />
                                                <span className="text-sm">View 3D</span>
                                            </a>
                                            <button
                                                onClick={() => handleBuyDesign(design)}
                                                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium transition"
                                            >
                                                <ShoppingCart size={16} />
                                                <span className="text-sm">₹999</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </article>
                        ))}

                        {(!data?.feed || data.feed.length === 0) && (
                            <div className="py-16 text-center text-gray-500">
                                <Flame size={48} className="mx-auto mb-4 opacity-30" />
                                <p>No designs yet. Be the first to share!</p>
                            </div>
                        )}
                    </div>
                </main>

                {/* Right Sidebar - Trending */}
                <aside className="hidden lg:block w-80 p-4 space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search @username or name"
                            value={searchQuery}
                            onChange={(e) => {
                                const query = e.target.value;
                                setSearchQuery(query);

                                // Debounce search
                                if (searchTimeout.current) clearTimeout(searchTimeout.current);
                                if (query.length >= 2) {
                                    setIsSearching(true);
                                    searchTimeout.current = setTimeout(async () => {
                                        try {
                                            const { data } = await axios.get(`/api/users/search?q=${encodeURIComponent(query)}`);
                                            setSearchResults(data.users || []);
                                        } catch {
                                            setSearchResults([]);
                                        } finally {
                                            setIsSearching(false);
                                        }
                                    }, 300);
                                } else {
                                    setSearchResults([]);
                                    setIsSearching(false);
                                }
                            }}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-full py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />

                        {/* Search Dropdown */}
                        {(searchResults.length > 0 || isSearching) && searchQuery.length >= 2 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50">
                                {isSearching ? (
                                    <div className="p-4 text-center text-gray-500">
                                        <Loader2 size={20} className="animate-spin mx-auto" />
                                    </div>
                                ) : searchResults.length > 0 ? (
                                    <div className="divide-y divide-zinc-800">
                                        {searchResults.map((user: any) => (
                                            <Link
                                                key={user.id}
                                                href={`/user/${user.id}`}
                                                onClick={() => {
                                                    setSearchQuery("");
                                                    setSearchResults([]);
                                                }}
                                                className="flex items-center gap-3 p-3 hover:bg-zinc-800 transition"
                                            >
                                                <div className="h-10 w-10 rounded-full bg-zinc-800 overflow-hidden flex-shrink-0">
                                                    {user.image ? (
                                                        <img src={user.image} className="w-full h-full object-cover" alt="" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <User size={18} className="text-gray-600" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-sm truncate">{user.name}</p>
                                                    <p className="text-xs text-gray-500">@{user.username || user.name?.toLowerCase().replace(/\s/g, '')}</p>
                                                </div>
                                                <span className={`text-xs px-1.5 py-0.5 rounded ${getRankColor(user.rank)}`}>
                                                    {user.rank}
                                                </span>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 text-center text-gray-500 text-sm">
                                        No users found
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Top Creators */}
                    <div className="bg-zinc-900 rounded-2xl p-4">
                        <h2 className="text-xl font-bold mb-4">Top Creators</h2>
                        <div className="space-y-4">
                            {data?.leaderboard?.slice(0, 5).map((user: any, index: number) => (
                                <div key={user.id} className="flex items-center gap-3">
                                    <div className="w-5 text-center text-sm font-bold text-gray-500">
                                        {index + 1}
                                    </div>
                                    <Link href={`/user/${user.id}`} className="h-10 w-10 rounded-full bg-zinc-800 overflow-hidden hover:ring-2 hover:ring-red-500 transition">
                                        {user.image ? (
                                            <img src={user.image} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <User size={16} className="text-gray-600" />
                                            </div>
                                        )}
                                    </Link>
                                    <Link href={`/user/${user.id}`} className="flex-1 min-w-0 hover:opacity-80 transition">
                                        <p className="font-bold text-sm truncate hover:underline">{user.name}</p>
                                        <p className="text-xs text-gray-500">{user.followersCount || 0} followers</p>
                                    </Link>
                                    {userInfo && user.id !== userInfo._id && (
                                        <button
                                            onClick={() => followMutation.mutate(user.id)}
                                            disabled={followMutation.isPending}
                                            className={`px-4 py-1 text-sm font-bold rounded-full transition disabled:opacity-50 ${user.isFollowing
                                                ? "bg-zinc-700 text-white border border-zinc-600 hover:border-red-500 hover:text-red-500"
                                                : "bg-white text-black hover:bg-gray-200"
                                                }`}
                                        >
                                            {followMutation.isPending ? "..." : user.isFollowing ? "Following" : "Follow"}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <Link href="/community?tab=creators" className="text-blue-500 text-sm mt-4 hover:underline block">Show more</Link>
                    </div>

                    {/* What's Trending */}
                    <div className="bg-zinc-900 rounded-2xl p-4">
                        <h2 className="text-xl font-bold mb-4">What&apos;s trending</h2>
                        <div className="space-y-3">
                            {data?.feed
                                ?.filter((d: any) => d.is3D)
                                .sort((a: any, b: any) => (b.likesCount || 0) - (a.likesCount || 0))
                                .slice(0, 4)
                                .map((design: any, index: number) => (
                                    <div key={design.id} className="bg-zinc-950 rounded-xl p-3 border border-zinc-800 hover:border-red-600/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="text-xl font-bold text-red-600 w-6">{index + 1}</div>
                                            {design.previewImage && (
                                                <div className="h-12 w-12 rounded-lg bg-zinc-800 overflow-hidden flex-shrink-0">
                                                    <img src={design.previewImage} alt="" className="h-full w-full object-cover" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold truncate text-sm">{design.name}</p>
                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Heart size={12} className="text-red-500 fill-red-500" /> {design.likesCount || 0} likes
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                            <a
                                                href={`${process.env.NEXT_PUBLIC_EDITOR_URL || 'http://localhost:3000'}?designId=${design.id}&viewOnly=true`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-zinc-800 text-white rounded-lg text-xs font-medium hover:bg-zinc-700 transition"
                                            >
                                                <Eye size={14} /> View
                                            </a>
                                            <button
                                                onClick={() => handleBuyDesign(design)}
                                                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition"
                                            >
                                                <ShoppingBag size={14} /> ₹999
                                            </button>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>

                    {/* Create Design CTA */}
                    <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-2xl p-4 border border-purple-500/20">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="text-purple-400" size={20} />
                            <h3 className="font-bold">Create Your Design</h3>
                        </div>
                        <p className="text-sm text-gray-400 mb-3">
                            Design custom t-shirts with our 3D editor
                        </p>
                        <Link
                            href="/customize"
                            className="block w-full py-2 bg-white text-black text-center text-sm font-bold rounded-full hover:bg-gray-200 transition"
                        >
                            Start Creating
                        </Link>
                    </div>
                </aside>
            </div>

            {/* Mobile Bottom Navigation Bar */}
            <div className="lg:hidden">
                {/* Fixed Bottom Nav */}
                <div className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/90 backdrop-blur-md border-t border-zinc-800 pb-safe">
                    <div className="flex items-center justify-around p-3">
                        <button
                            onClick={() => setMobileView("search")}
                            className={`flex flex-col items-center gap-1 transition ${mobileView === "search" ? "text-blue-500" : "text-gray-400 hover:text-white"}`}
                        >
                            <Search size={24} />
                            <span className="text-[10px] font-medium">Search</span>
                        </button>

                        <button
                            onClick={() => setMobileView("trending")}
                            className={`flex flex-col items-center gap-1 transition ${mobileView === "trending" ? "text-red-500" : "text-gray-400 hover:text-white"}`}
                        >
                            <Flame size={24} />
                            <span className="text-[10px] font-medium">Trending</span>
                        </button>

                        <Link
                            href="/customize"
                            className="flex flex-col items-center justify-center -mt-6"
                        >
                            <div className="h-14 w-14 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 border-4 border-black">
                                <Plus size={28} />
                            </div>
                        </Link>

                        <button
                            onClick={() => setMobileView("creators")}
                            className={`flex flex-col items-center gap-1 transition ${mobileView === "creators" ? "text-yellow-500" : "text-gray-400 hover:text-white"}`}
                        >
                            <Crown size={24} />
                            <span className="text-[10px] font-medium">Creators</span>
                        </button>

                        <Link
                            href="/shop"
                            className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition"
                        >
                            <ShoppingBag size={24} />
                            <span className="text-[10px] font-medium">Shop</span>
                        </Link>
                    </div>
                </div>

                {/* Bottom Sheet Modal */}
                {mobileView && (
                    <div className="fixed inset-0 z-50 flex items-end">
                        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setMobileView(null)} />
                        <div className="relative w-full bg-zinc-900 rounded-t-3xl border-t border-zinc-800 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
                            {/* Sheet Header */}
                            <div className="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur p-4 border-b border-zinc-800 flex items-center justify-between">
                                <h3 className="font-bold text-lg capitalize">
                                    {mobileView === "search" && "Search Community"}
                                    {mobileView === "trending" && "What's Trending"}
                                    {mobileView === "creators" && "Top Creators"}
                                </h3>
                                <button onClick={() => setMobileView(null)} className="p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 transition">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-4 pb-24 space-y-6">
                                {/* Conditional Content Based on View */}

                                {/* SEARCH VIEW */}
                                {mobileView === "search" && (
                                    <div className="flex flex-col h-full">
                                        {/* Pinned Search Input */}
                                        <div className="relative flex-shrink-0 sticky top-0 bg-zinc-900 pb-4 z-10">
                                            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                            <input
                                                type="text"
                                                placeholder="Search @username or name"
                                                value={searchQuery}
                                                autoFocus
                                                onChange={(e) => {
                                                    const query = e.target.value;
                                                    setSearchQuery(query);

                                                    if (searchTimeout.current) clearTimeout(searchTimeout.current);
                                                    if (query.length >= 2) {
                                                        setIsSearching(true);
                                                        searchTimeout.current = setTimeout(async () => {
                                                            try {
                                                                const { data } = await axios.get(`/api/users/search?q=${encodeURIComponent(query)}`);
                                                                setSearchResults(data.users || []);
                                                            } catch {
                                                                setSearchResults([]);
                                                            } finally {
                                                                setIsSearching(false);
                                                            }
                                                        }, 300);
                                                    } else {
                                                        setSearchResults([]);
                                                        setIsSearching(false);
                                                    }
                                                }}
                                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-base focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                            />
                                        </div>

                                        {/* Scrollable Search Results */}
                                        <div className="flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom,50px)]">
                                            {(searchResults.length > 0 || isSearching) && searchQuery.length >= 2 && (
                                                <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
                                                    {isSearching ? (
                                                        <div className="p-6 text-center text-gray-500">
                                                            <Loader2 size={24} className="animate-spin mx-auto" />
                                                        </div>
                                                    ) : searchResults.length > 0 ? (
                                                        <div className="divide-y divide-zinc-800">
                                                            {searchResults.map((user: any) => (
                                                                <Link
                                                                    key={user.id}
                                                                    href={`/user/${user.id}`}
                                                                    onClick={() => {
                                                                        setSearchQuery("");
                                                                        setSearchResults([]);
                                                                        setMobileView(null);
                                                                    }}
                                                                    className="flex items-center gap-4 p-4 hover:bg-zinc-800 transition"
                                                                >
                                                                    <div className="h-12 w-12 rounded-full bg-zinc-800 overflow-hidden flex-shrink-0">
                                                                        {user.image ? (
                                                                            <img src={user.image} className="w-full h-full object-cover" alt="" />
                                                                        ) : (
                                                                            <div className="w-full h-full flex items-center justify-center">
                                                                                <User size={20} className="text-gray-600" />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="font-bold text-base truncate">{user.name}</p>
                                                                        <p className="text-sm text-gray-500">@{user.username || user.name?.toLowerCase().replace(/\s/g, '')}</p>
                                                                    </div>
                                                                    <span className={`text-xs px-2 py-1 rounded ${getRankColor(user.rank)}`}>
                                                                        {user.rank}
                                                                    </span>
                                                                </Link>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="p-6 text-center text-gray-500">
                                                            No users found
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Empty state placeholder */}
                                            {searchQuery.length < 2 && (
                                                <div className="text-center text-gray-600 py-12">
                                                    <Search size={48} className="mx-auto mb-4 opacity-30" />
                                                    <p>Type at least 2 characters to search</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* TRENDING VIEW */}
                                {mobileView === "trending" && (
                                    <div className="space-y-4">
                                        {/* Period Filter */}
                                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                            {[
                                                { value: "today", label: "Today" },
                                                { value: "week", label: "This Week" },
                                                { value: "month", label: "This Month" },
                                                { value: "alltime", label: "All Time" }
                                            ].map((p) => (
                                                <button
                                                    key={p.value}
                                                    onClick={() => setPeriod(p.value)}
                                                    className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition ${period === p.value
                                                        ? "bg-white text-black"
                                                        : "bg-zinc-800 text-gray-400 hover:text-white"
                                                        }`}
                                                >
                                                    {p.label}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Trending Designs List */}
                                        {data?.feed
                                            ?.filter((d: any) => d.is3D)
                                            .sort((a: any, b: any) => (b.likesCount || 0) - (a.likesCount || 0))
                                            .slice(0, 5)
                                            .map((design: any, index: number) => (
                                                <div
                                                    key={design.id}
                                                    className="bg-zinc-950 p-4 rounded-xl border border-zinc-800"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-3xl font-bold text-red-600 w-10 text-center">{index + 1}</div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold truncate text-lg">
                                                                {design.name}
                                                            </p>
                                                            <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                                                <Heart size={14} className="text-red-500 fill-red-500" /> {design.likesCount || 0} likes
                                                            </p>
                                                            <p className="text-xs text-gray-600 mt-1">by {design.user?.name}</p>
                                                        </div>
                                                        {design.previewImage && (
                                                            <div className="h-16 w-16 rounded-lg bg-zinc-800 overflow-hidden flex-shrink-0">
                                                                <img src={design.previewImage} alt="" className="h-full w-full object-cover" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Action buttons */}
                                                    <div className="flex gap-2 mt-3">
                                                        <a
                                                            href={`${process.env.NEXT_PUBLIC_EDITOR_URL || 'http://localhost:3000'}?designId=${design.id}&viewOnly=true`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-zinc-800 text-white rounded-lg text-sm font-medium hover:bg-zinc-700 transition"
                                                        >
                                                            <Eye size={16} /> View 3D
                                                        </a>
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                handleBuyDesign(design);
                                                                setMobileView(null);
                                                            }}
                                                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition"
                                                        >
                                                            <ShoppingBag size={16} /> ₹999
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                )}

                                {/* CREATORS VIEW */}
                                {mobileView === "creators" && (
                                    <div className="space-y-4">
                                        {/* Period Filter */}
                                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                            {[
                                                { value: "today", label: "Today" },
                                                { value: "week", label: "This Week" },
                                                { value: "month", label: "This Month" },
                                                { value: "alltime", label: "All Time" }
                                            ].map((p) => (
                                                <button
                                                    key={p.value}
                                                    onClick={() => setPeriod(p.value)}
                                                    className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition ${period === p.value
                                                        ? "bg-white text-black"
                                                        : "bg-zinc-800 text-gray-400 hover:text-white"
                                                        }`}
                                                >
                                                    {p.label}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Creators List */}
                                        {data?.leaderboard?.slice(0, 10).map((user: any, index: number) => (
                                            <div key={user.id} className="flex items-center gap-4 bg-zinc-950 p-4 rounded-xl border border-zinc-800 hover:border-red-600/50 transition-colors">
                                                <div className="w-8 text-center text-xl font-bold text-red-600">
                                                    {index + 1}
                                                </div>
                                                <Link href={`/user/${user.id}`} className="h-14 w-14 rounded-full bg-zinc-800 overflow-hidden hover:ring-2 hover:ring-red-500 transition flex-shrink-0">
                                                    {user.image ? (
                                                        <img src={user.image} className="w-full h-full object-cover" alt="" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <User size={24} className="text-gray-600" />
                                                        </div>
                                                    )}
                                                </Link>
                                                <Link href={`/user/${user.id}`} className="flex-1 min-w-0 hover:opacity-80 transition">
                                                    <p className="font-bold text-base truncate hover:underline">{user.name}</p>
                                                    <p className="text-sm text-gray-500">{user.followersCount || 0} followers</p>
                                                    <p className="text-xs text-gray-600">{user._count?.designs || 0} designs</p>
                                                </Link>
                                                {userInfo && user.id !== userInfo._id && (
                                                    <button
                                                        onClick={() => followMutation.mutate(user.id)}
                                                        disabled={followMutation.isPending}
                                                        className={`px-4 py-2 text-sm font-bold rounded-full transition disabled:opacity-50 ${user.isFollowing
                                                            ? "bg-zinc-800 text-white border border-zinc-700"
                                                            : "bg-red-600 text-white hover:bg-red-700"
                                                            }`}
                                                    >
                                                        {followMutation.isPending ? "..." : user.isFollowing ? "Following" : "Follow"}
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* YouTube-Style Comments Section */}
            {selectedDesign && selectedDesign.is3D && (
                <CommentSection
                    designId={selectedDesign.id}
                    userInfo={userInfo}
                    onClose={() => setSelectedDesign(null)}
                />
            )}
        </div>
    );
}