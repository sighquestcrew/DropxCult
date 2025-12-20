"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Loader2, User, Crown, Calendar, Palette, Heart, Users, ArrowLeft, Share2, Eye, ShoppingCart, Sparkles } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import dayjs from "dayjs";

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id: userId } = use(params);
    const { userInfo } = useSelector((state: RootState) => state.auth);
    const router = useRouter();
    const queryClient = useQueryClient();
    const [showFollowModal, setShowFollowModal] = useState<"followers" | "following" | null>(null);

    // Fetch followers/following list
    const { data: followData, isLoading: followLoading } = useQuery({
        queryKey: ["follow-list", userId, showFollowModal],
        queryFn: async () => {
            const { data } = await axios.get(`/api/users/${userId}/followers?type=${showFollowModal}`);
            return data;
        },
        enabled: !!showFollowModal,
    });

    const { data, isLoading, error } = useQuery({
        queryKey: ["user-profile", userId],
        queryFn: async () => {
            const { data } = await axios.get(`/api/users/${userId}`, {
                headers: userInfo?.token ? { Authorization: `Bearer ${userInfo.token}` } : {}
            });
            return data;
        },
    });

    const followMutation = useMutation({
        mutationFn: async () => {
            const { data } = await axios.post(`/api/users/${userId}/follow`, {}, {
                headers: { Authorization: `Bearer ${userInfo?.token}` }
            });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user-profile", userId] });
            toast.success(data?.user?.isFollowing ? "Unfollowed" : "Followed!");
        },
        onError: () => toast.error("Please login to follow")
    });

    const handleShare = async () => {
        const url = `${window.location.origin}/user/${userId}`;
        try {
            await navigator.clipboard.writeText(url);
            toast.success("Profile link copied!");
        } catch {
            toast.error("Failed to copy link");
        }
    };

    const getRankColor = (rank: string) => {
        switch (rank) {
            case "Founder": return "text-yellow-500 bg-yellow-500/10 border-yellow-500/30";
            case "Elder": return "text-purple-500 bg-purple-500/10 border-purple-500/30";
            case "Zealot": return "text-red-500 bg-red-500/10 border-red-500/30";
            case "Apostle": return "text-orange-500 bg-orange-500/10 border-orange-500/30";
            case "Disciple": return "text-blue-500 bg-blue-500/10 border-blue-500/30";
            default: return "text-gray-400 bg-gray-500/10 border-gray-500/30";
        }
    };

    if (isLoading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <Loader2 className="animate-spin text-red-600" size={32} />
        </div>
    );

    if (error || !data?.user) return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
            <User size={64} className="text-gray-700 mb-4" />
            <h1 className="text-xl font-bold mb-2">User not found</h1>
            <Link href="/community" className="text-blue-500 hover:underline">Back to Community</Link>
        </div>
    );

    const profile = data.user;
    const designs = data.designs;

    return (
        <div className="min-h-screen bg-black text-white">
            <div className="max-w-4xl mx-auto">

                {/* Back Button */}
                <div className="p-4 sticky top-0 bg-black/80 backdrop-blur-md z-40 flex items-center gap-4 border-b border-zinc-800">
                    <button onClick={() => router.back()} className="p-2 hover:bg-zinc-800 rounded-full transition">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="font-bold">{profile.name}</h1>
                        <p className="text-xs text-gray-500">{designs?.length || 0} designs</p>
                    </div>
                </div>

                {/* Cover/Banner */}
                <div className="h-32 sm:h-48 relative">
                    {profile.banner ? (
                        <img src={profile.banner} alt="Banner" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-r from-red-900/50 via-purple-900/30 to-zinc-900">
                            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
                        </div>
                    )}
                </div>

                {/* Profile Header */}
                <div className="relative px-4 pb-4 border-b border-zinc-800">
                    {/* Avatar */}
                    <div className="absolute -top-16 sm:-top-20 left-4">
                        <div className="h-28 w-28 sm:h-36 sm:w-36 rounded-full bg-gradient-to-br from-red-600 to-purple-600 p-1">
                            <div className="h-full w-full rounded-full bg-black border-4 border-black overflow-hidden flex items-center justify-center">
                                {profile.image ? (
                                    <img src={profile.image} className="h-full w-full object-cover" alt={profile.name} />
                                ) : (
                                    <span className="text-4xl sm:text-5xl font-bold text-gray-600">
                                        {profile.name?.charAt(0) || "U"}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2 pt-3 sm:pt-4">
                        <button
                            onClick={handleShare}
                            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full border border-zinc-700 transition"
                            title="Share Profile"
                        >
                            <Share2 size={18} />
                        </button>

                        {profile.isOwnProfile ? (
                            <Link
                                href="/profile"
                                className="px-4 py-2 bg-white text-black font-bold text-sm rounded-full hover:bg-gray-200 transition"
                            >
                                Edit Profile
                            </Link>
                        ) : (
                            <button
                                onClick={() => followMutation.mutate()}
                                disabled={followMutation.isPending}
                                className={`px-5 py-2 font-bold text-sm rounded-full transition ${profile.isFollowing
                                    ? "bg-zinc-800 text-white border border-zinc-600 hover:border-red-500 hover:text-red-500"
                                    : "bg-white text-black hover:bg-gray-200"
                                    }`}
                            >
                                {followMutation.isPending
                                    ? <Loader2 size={16} className="animate-spin" />
                                    : profile.isFollowing ? "Following" : "Follow"
                                }
                            </button>
                        )}
                    </div>

                    {/* Profile Info */}
                    <div className="mt-6 sm:mt-8">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-xl sm:text-2xl font-bold">{profile.name}</h1>
                            {profile.isCreator && (
                                <span className="px-2 py-0.5 text-xs font-bold rounded-full border text-cyan-500 bg-cyan-500/10 border-cyan-500/30 flex items-center gap-1">
                                    <Sparkles size={10} />
                                    Creator
                                </span>
                            )}
                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${getRankColor(profile.rank)}`}>
                                <Crown size={10} className="inline mr-1" />
                                {profile.rank}
                            </span>
                        </div>
                        <p className="text-gray-500 text-sm">@{profile.name?.toLowerCase().replace(/\s/g, '')}</p>

                        {profile.bio && (
                            <p className="mt-3 text-gray-300 text-sm max-w-lg">{profile.bio}</p>
                        )}

                        {/* Meta Info */}
                        <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                                <Calendar size={14} />
                                Joined {dayjs(profile.createdAt).format("MMM YYYY")}
                            </span>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-6 mt-4 text-sm">
                            <button onClick={() => setShowFollowModal("followers")} className="hover:underline">
                                <span className="font-bold text-white">{profile.followersCount || 0}</span>
                                <span className="text-gray-500 ml-1">Followers</span>
                            </button>
                            <button onClick={() => setShowFollowModal("following")} className="hover:underline">
                                <span className="font-bold text-white">{profile.followingCount || 0}</span>
                                <span className="text-gray-500 ml-1">Following</span>
                            </button>
                            <div>
                                <span className="font-bold text-white">{profile.designsCount || designs?.length || 0}</span>
                                <span className="text-gray-500 ml-1">Designs</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Followers/Following Modal */}
                {showFollowModal && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowFollowModal(null)}>
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                                <h2 className="text-lg font-bold capitalize">{showFollowModal}</h2>
                                <button onClick={() => setShowFollowModal(null)} className="text-gray-500 hover:text-white text-xl">✕</button>
                            </div>
                            <div className="overflow-y-auto max-h-[60vh]">
                                {followLoading ? (
                                    <div className="p-8 text-center">
                                        <Loader2 className="animate-spin mx-auto text-gray-500" size={24} />
                                    </div>
                                ) : followData?.users?.length > 0 ? (
                                    <div className="divide-y divide-zinc-800">
                                        {followData.users.map((user: any) => (
                                            <Link
                                                key={user.id}
                                                href={`/user/${user.id}`}
                                                onClick={() => setShowFollowModal(null)}
                                                className="flex items-center gap-3 p-4 hover:bg-zinc-800 transition"
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
                                                    <p className="font-bold truncate">{user.name}</p>
                                                    <p className="text-sm text-gray-500">@{user.username || user.name?.toLowerCase().replace(/\s/g, '')}</p>
                                                </div>
                                                <span className={`text-xs px-2 py-1 rounded-full border ${getRankColor(user.rank)}`}>
                                                    <Crown size={10} className="inline mr-1" />
                                                    {user.rank}
                                                </span>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-gray-500">
                                        <Users size={32} className="mx-auto mb-2 opacity-50" />
                                        <p>No {showFollowModal} yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Designs Section */}
                <div className="p-4">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Palette size={20} className="text-purple-500" /> Designs
                    </h2>

                    {designs && designs.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {designs.map((design: any) => (
                                <div key={design.id} className="group relative bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-red-500/50 transition">
                                    <div className="aspect-square bg-black">
                                        {design.previewImage ? (
                                            <img
                                                src={design.previewImage}
                                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition"
                                                alt={design.name}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-700">
                                                <Palette size={32} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3">
                                        <p className="text-sm font-bold truncate">{design.name}</p>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Heart size={12} className="text-red-500" />
                                                {design.likesCount || 0}
                                            </span>
                                            <span>{design.tshirtType}</span>
                                        </div>
                                    </div>

                                    {/* Actions overlay */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
                                        <a
                                            href={`${process.env.NEXT_PUBLIC_EDITOR_URL || 'http://localhost:3000'}?designId=${design.id}&viewOnly=true`}
                                            target="_blank"
                                            className="p-2 bg-purple-600 rounded-full hover:bg-purple-700 transition"
                                            title="View in 3D"
                                        >
                                            <Eye size={18} />
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Palette size={48} className="mx-auto mb-4 text-gray-700" />
                            <p className="text-gray-500">No public designs yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}
