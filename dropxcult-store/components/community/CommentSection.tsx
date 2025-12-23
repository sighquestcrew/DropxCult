"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { ThumbsUp, ThumbsDown, MessageCircle, ChevronDown, ChevronUp, Send, X, User } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface CommentUser {
    id: string;
    name: string;
    image: string | null;
    rank: string;
}

interface Reply {
    id: string;
    content: string;
    likesCount: number;
    dislikesCount: number;
    likedByUser: boolean;
    user: CommentUser;
    createdAt: string;
}

interface Comment {
    id: string;
    content: string;
    likesCount: number;
    dislikesCount: number;
    repliesCount: number;
    likedByUser: boolean;
    user: CommentUser;
    replies: Reply[];
    createdAt: string;
}

interface CommentSectionProps {
    designId: string;
    userInfo: { token: string; _id: string; name?: string; image?: string } | null;
    onClose: () => void;
}

export default function CommentSection({ designId, userInfo, onClose }: CommentSectionProps) {
    const queryClient = useQueryClient();
    const [sortBy, setSortBy] = useState<"top" | "newest">("top");
    const [commentText, setCommentText] = useState("");
    const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
    const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
    const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
    const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
    const [dislikedComments, setDislikedComments] = useState<Set<string>>(new Set());
    const inputRef = useRef<HTMLInputElement>(null);

    // Fetch comments
    const { data: comments = [], isLoading } = useQuery({
        queryKey: ["comments", designId, sortBy],
        queryFn: async () => {
            const headers = userInfo?.token ? { Authorization: `Bearer ${userInfo.token}` } : {};
            const { data } = await axios.get(`/api/designs/${designId}/comments?sort=${sortBy}`, { headers });
            return data as Comment[];
        }
    });

    // Update liked state from server data
    useEffect(() => {
        if (comments.length > 0) {
            const liked = new Set<string>();
            comments.forEach(c => {
                if (c.likedByUser) liked.add(c.id);
                c.replies?.forEach(r => {
                    if (r.likedByUser) liked.add(r.id);
                });
            });
            setLikedComments(liked);
        }
    }, [comments]);

    // Add comment mutation
    const commentMutation = useMutation({
        mutationFn: async ({ content, parentId }: { content: string; parentId?: string }) => {
            const { data } = await axios.post(
                `/api/designs/${designId}/comments`,
                { content, parentId },
                { headers: { Authorization: `Bearer ${userInfo?.token}` } }
            );
            return data;
        },
        onSuccess: () => {
            setCommentText("");
            setReplyingTo(null);
            queryClient.invalidateQueries({ queryKey: ["comments", designId] });
            toast.success("Comment added!");
        },
        onError: () => toast.error("Please login to comment")
    });

    // Like mutation
    const likeMutation = useMutation({
        mutationFn: async (commentId: string) => {
            const { data } = await axios.post(
                `/api/comments/${commentId}/like`,
                {},
                { headers: { Authorization: `Bearer ${userInfo?.token}` } }
            );
            return { ...data, commentId };
        },
        onSuccess: ({ liked, commentId }) => {
            setLikedComments(prev => {
                const newSet = new Set(prev);
                if (liked) {
                    newSet.add(commentId);
                    // Remove from dislikes if present
                    setDislikedComments(d => {
                        const newD = new Set(d);
                        newD.delete(commentId);
                        return newD;
                    });
                } else {
                    newSet.delete(commentId);
                }
                return newSet;
            });
            queryClient.invalidateQueries({ queryKey: ["comments", designId] });
        },
        onError: () => toast.error("Please login to like")
    });

    // Dislike mutation
    const dislikeMutation = useMutation({
        mutationFn: async (commentId: string) => {
            const isDisliked = dislikedComments.has(commentId);
            const { data } = await axios.post(
                `/api/comments/${commentId}/dislike`,
                { action: isDisliked ? "undislike" : "dislike" },
                { headers: { Authorization: `Bearer ${userInfo?.token}` } }
            );
            return { ...data, commentId };
        },
        onSuccess: ({ disliked, commentId }) => {
            setDislikedComments(prev => {
                const newSet = new Set(prev);
                if (disliked) {
                    newSet.add(commentId);
                    // Remove from likes if present
                    setLikedComments(l => {
                        const newL = new Set(l);
                        newL.delete(commentId);
                        return newL;
                    });
                } else {
                    newSet.delete(commentId);
                }
                return newSet;
            });
            queryClient.invalidateQueries({ queryKey: ["comments", designId] });
        },
        onError: () => toast.error("Please login to dislike")
    });

    // Helper: Format time ago
    const getTimeAgo = (dateStr: string) => {
        const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
        if (seconds < 60) return "Just now";
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return `${Math.floor(seconds / 604800)}w ago`;
    };

    // Helper: Format count
    const formatCount = (count: number) => {
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
        if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
        return count.toString();
    };

    // Toggle replies visibility
    const toggleReplies = (commentId: string) => {
        setExpandedReplies(prev => {
            const newSet = new Set(prev);
            if (newSet.has(commentId)) newSet.delete(commentId);
            else newSet.add(commentId);
            return newSet;
        });
    };

    // Toggle "Read more" for long comments
    const toggleExpanded = (commentId: string) => {
        setExpandedComments(prev => {
            const newSet = new Set(prev);
            if (newSet.has(commentId)) newSet.delete(commentId);
            else newSet.add(commentId);
            return newSet;
        });
    };

    // Handle reply click
    const handleReply = (comment: Comment | Reply) => {
        setReplyingTo({ id: comment.id, name: comment.user?.name || "User" });
        inputRef.current?.focus();
    };

    // Submit comment
    const handleSubmit = () => {
        if (commentText.trim()) {
            commentMutation.mutate({
                content: commentText,
                parentId: replyingTo?.id
            });
        }
    };

    // Render single comment
    const renderComment = (comment: Comment | Reply, isReply = false) => {
        const isLong = comment.content.length > 200;
        const isExpanded = expandedComments.has(comment.id);
        const displayContent = isLong && !isExpanded
            ? comment.content.slice(0, 200) + "..."
            : comment.content;

        return (
            <div key={comment.id} className={`flex gap-3 ${isReply ? "pl-10" : ""}`}>
                {/* Avatar */}
                <div className={`${isReply ? "h-8 w-8" : "h-10 w-10"} rounded-full bg-zinc-800 flex-shrink-0 overflow-hidden flex items-center justify-center`}>
                    {comment.user?.image ? (
                        <img src={comment.user.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <span className={`font-bold ${isReply ? "text-xs" : "text-sm"}`}>
                            {comment.user?.name?.charAt(0)?.toUpperCase() || "U"}
                        </span>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Header: Name + Time */}
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`font-semibold ${isReply ? "text-xs" : "text-sm"}`}>
                            @{comment.user?.name?.toLowerCase().replace(/\s/g, "") || "user"}
                        </span>
                        <span className={`text-gray-500 ${isReply ? "text-[10px]" : "text-xs"}`}>
                            {getTimeAgo(comment.createdAt)}
                        </span>
                    </div>

                    {/* Comment Text */}
                    <p className={`text-gray-200 ${isReply ? "text-xs" : "text-sm"} whitespace-pre-wrap break-words`}>
                        {displayContent}
                    </p>
                    {isLong && (
                        <button
                            onClick={() => toggleExpanded(comment.id)}
                            className="text-blue-400 text-xs mt-1 hover:underline"
                        >
                            {isExpanded ? "Show less" : "Read more"}
                        </button>
                    )}

                    {/* Actions: Like, Dislike, Reply */}
                    <div className="flex items-center gap-4 mt-2">
                        {/* Like */}
                        <button
                            onClick={() => likeMutation.mutate(comment.id)}
                            className={`flex items-center gap-1 transition ${likedComments.has(comment.id)
                                ? "text-blue-500"
                                : "text-gray-500 hover:text-white"
                                }`}
                        >
                            <ThumbsUp size={isReply ? 14 : 16} className={likedComments.has(comment.id) ? "fill-blue-500" : ""} />
                            {comment.likesCount > 0 && (
                                <span className="text-xs">{formatCount(comment.likesCount)}</span>
                            )}
                        </button>

                        {/* Dislike */}
                        <button
                            onClick={() => dislikeMutation.mutate(comment.id)}
                            className={`flex items-center gap-1 transition ${dislikedComments.has(comment.id)
                                ? "text-gray-300"
                                : "text-gray-500 hover:text-white"
                                }`}
                        >
                            <ThumbsDown size={isReply ? 14 : 16} className={dislikedComments.has(comment.id) ? "fill-gray-300" : ""} />
                        </button>

                        {/* Reply */}
                        {!isReply && (
                            <button
                                onClick={() => handleReply(comment)}
                                className="text-gray-500 hover:text-white text-xs font-medium transition"
                            >
                                Reply
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col" onClick={onClose}>
            <div
                className="bg-zinc-900 w-full max-w-lg h-full md:h-[85vh] md:my-auto md:mx-auto md:rounded-2xl flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                        <h3 className="font-bold text-lg">Comments</h3>
                        <span className="text-sm text-gray-500">
                            {comments.length}
                        </span>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition">
                        <X size={20} />
                    </button>
                </div>

                {/* Sort Tabs */}
                <div className="flex gap-2 px-4 py-3 border-b border-zinc-800">
                    <button
                        onClick={() => setSortBy("top")}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${sortBy === "top"
                            ? "bg-white text-black"
                            : "bg-zinc-800 text-gray-400 hover:text-white"
                            }`}
                    >
                        Top
                    </button>
                    <button
                        onClick={() => setSortBy("newest")}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${sortBy === "newest"
                            ? "bg-white text-black"
                            : "bg-zinc-800 text-gray-400 hover:text-white"
                            }`}
                    >
                        Newest
                    </button>
                </div>

                {/* Comments List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-5">
                    {isLoading ? (
                        <div className="text-center text-gray-500 py-8">Loading...</div>
                    ) : comments.length === 0 ? (
                        <div className="text-center text-gray-500 py-12">
                            <MessageCircle size={48} className="mx-auto mb-4 opacity-30" />
                            <p className="text-lg font-medium">No comments yet</p>
                            <p className="text-sm mt-1">Be the first to comment!</p>
                        </div>
                    ) : (
                        comments.map((comment: Comment) => (
                            <div key={comment.id} className="space-y-3">
                                {renderComment(comment)}

                                {/* Replies Toggle */}
                                {comment.replies && comment.replies.length > 0 && (
                                    <div className="pl-10">
                                        <button
                                            onClick={() => toggleReplies(comment.id)}
                                            className="flex items-center gap-2 text-blue-400 text-sm font-medium hover:bg-blue-500/10 px-3 py-1.5 rounded-full transition"
                                        >
                                            {expandedReplies.has(comment.id) ? (
                                                <ChevronUp size={16} />
                                            ) : (
                                                <ChevronDown size={16} />
                                            )}
                                            {comment.replies.length} {comment.replies.length === 1 ? "reply" : "replies"}
                                        </button>

                                        {/* Nested Replies */}
                                        {expandedReplies.has(comment.id) && (
                                            <div className="mt-3 space-y-3">
                                                {comment.replies.map(reply => renderComment(reply, true))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Input Bar */}
                {userInfo ? (
                    <div className="p-4 border-t border-zinc-800 bg-zinc-900">
                        {/* Replying to indicator */}
                        {replyingTo && (
                            <div className="flex items-center justify-between mb-2 text-sm text-gray-400">
                                <span>Replying to @{replyingTo.name}</span>
                                <button
                                    onClick={() => setReplyingTo(null)}
                                    className="text-gray-500 hover:text-white"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                            {/* User Avatar */}
                            <div className="h-8 w-8 rounded-full bg-zinc-800 flex-shrink-0 overflow-hidden flex items-center justify-center">
                                {userInfo.image ? (
                                    <img src={userInfo.image} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={16} className="text-gray-500" />
                                )}
                            </div>

                            {/* Input */}
                            <input
                                ref={inputRef}
                                type="text"
                                value={commentText}
                                onChange={e => setCommentText(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit();
                                    }
                                }}
                                placeholder={replyingTo ? "Add a reply..." : "Add a comment..."}
                                className="flex-1 bg-transparent border-b border-zinc-700 px-2 py-2 text-sm focus:outline-none focus:border-white transition"
                            />

                            {/* Send Button */}
                            <button
                                onClick={handleSubmit}
                                disabled={!commentText.trim() || commentMutation.isPending}
                                className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 border-t border-zinc-800 text-center">
                        <Link href="/login" className="text-blue-500 hover:underline">
                            Log in
                        </Link>{" "}
                        to comment
                    </div>
                )}
            </div>
        </div>
    );
}
