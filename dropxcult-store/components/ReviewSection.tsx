"use client";

import { useState, useEffect, useRef } from "react";
import { Star, User, Check, Loader2, Send, ImagePlus, X } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { getReviewImage } from "@/lib/cloudinary";

interface Review {
    id: string;
    rating: number;
    title: string | null;
    comment: string;
    images: string[];
    isVerified: boolean;
    createdAt: string;
    user: {
        id: string;
        name: string;
        image: string | null;
    };
}

interface ReviewStats {
    count: number;
    average: number;
    distribution: Record<number, number>;
}

interface ReviewSectionProps {
    productId: string;
}

export default function ReviewSection({ productId }: ReviewSectionProps) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [stats, setStats] = useState<ReviewStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form state
    const [rating, setRating] = useState(5);
    const [title, setTitle] = useState("");
    const [comment, setComment] = useState("");
    const [images, setImages] = useState<string[]>([]);
    const [hoverRating, setHoverRating] = useState(0);

    const fetchReviews = async () => {
        try {
            const { data } = await axios.get(`/api/reviews?productId=${productId}`);
            setReviews(data.reviews);
            setStats(data.stats);
        } catch (error) {
            console.error("Failed to fetch reviews");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, [productId]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        if (images.length >= 3) {
            toast.error("Maximum 3 images allowed");
            return;
        }

        const file = files[0];
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image must be less than 5MB");
            return;
        }

        const userInfo = localStorage.getItem("storeUserInfo");
        const token = userInfo ? JSON.parse(userInfo).token : null;
        if (!token) {
            toast.error("Please login to upload images");
            return;
        }

        setUploadingImage(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const { data } = await axios.post("/api/upload", formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data"
                }
            });

            setImages(prev => [...prev, data.url]);
            toast.success("Image uploaded!");
        } catch (error) {
            toast.error("Failed to upload image");
        } finally {
            setUploadingImage(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!comment.trim()) {
            toast.error("Please write a review");
            return;
        }

        const userInfo = localStorage.getItem("storeUserInfo");
        const token = userInfo ? JSON.parse(userInfo).token : null;
        if (!token) {
            toast.error("Please login to review");
            return;
        }

        setSubmitting(true);
        try {
            const { data } = await axios.post("/api/reviews", {
                productId,
                rating,
                title: title || null,
                comment,
                images
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success(data.message);
            setShowForm(false);
            setComment("");
            setTitle("");
            setRating(5);
            setImages([]);
            fetchReviews();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to submit review");
        } finally {
            setSubmitting(false);
        }
    };

    const renderStars = (value: number, interactive = false) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        disabled={!interactive}
                        onClick={() => interactive && setRating(star)}
                        onMouseEnter={() => interactive && setHoverRating(star)}
                        onMouseLeave={() => interactive && setHoverRating(0)}
                        className={`${interactive ? "cursor-pointer" : "cursor-default"}`}
                    >
                        <Star
                            size={interactive ? 24 : 16}
                            className={`${star <= (interactive ? (hoverRating || rating) : value)
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-600"
                                } transition-colors`}
                        />
                    </button>
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="py-8 flex justify-center">
                <Loader2 className="animate-spin text-gray-500" size={24} />
            </div>
        );
    }

    return (
        <div className="border-t border-zinc-800 pt-8 mt-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-bold text-white">Customer Reviews</h3>
                    {stats && stats.count > 0 && (
                        <div className="flex items-center gap-2 mt-1">
                            {renderStars(Math.round(stats.average))}
                            <span className="text-gray-400 text-sm">
                                {stats.average} out of 5 ({stats.count} review{stats.count !== 1 ? 's' : ''})
                            </span>
                        </div>
                    )}
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium text-sm transition-colors"
                >
                    Write a Review
                </button>
            </div>

            {/* Review Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 mb-6">
                    <div className="mb-4">
                        <label className="block text-sm text-gray-400 mb-2">Your Rating</label>
                        {renderStars(rating, true)}
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm text-gray-400 mb-1">Title (optional)</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Summary of your review"
                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white placeholder-gray-500"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm text-gray-400 mb-1">Your Review *</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Share your experience with this product..."
                            rows={4}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white placeholder-gray-500 resize-none"
                        />
                    </div>

                    {/* Image Upload */}
                    <div className="mb-4">
                        <label className="block text-sm text-gray-400 mb-2">Add Photos (optional, max 3)</label>
                        <div className="flex flex-wrap gap-3">
                            {images.map((img, idx) => (
                                <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden bg-zinc-800">
                                    <img src={img} alt={`Review ${idx + 1}`} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(idx)}
                                        className="absolute top-1 right-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                            {images.length < 3 && (
                                <label className="w-20 h-20 border-2 border-dashed border-zinc-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-zinc-500 transition-colors">
                                    {uploadingImage ? (
                                        <Loader2 size={20} className="animate-spin text-gray-500" />
                                    ) : (
                                        <>
                                            <ImagePlus size={20} className="text-gray-500" />
                                            <span className="text-xs text-gray-500 mt-1">Add</span>
                                        </>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageUpload}
                                        disabled={uploadingImage}
                                    />
                                </label>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            Submit Review
                        </button>
                        <button
                            type="button"
                            onClick={() => { setShowForm(false); setImages([]); }}
                            className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded font-medium transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {/* Reviews List */}
            {reviews.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <Star size={40} className="mx-auto mb-3 opacity-50" />
                    <p>No reviews yet. Be the first to review!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map((review) => (
                        <div key={review.id} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center shrink-0">
                                    {review.user.image ? (
                                        <img
                                            src={review.user.image}
                                            alt={review.user.name}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    ) : (
                                        <User size={20} className="text-gray-500" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-white">{review.user.name}</span>
                                        {review.isVerified && (
                                            <span className="flex items-center gap-1 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                                                <Check size={12} /> Verified Purchase
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                        {renderStars(review.rating)}
                                        <span className="text-xs text-gray-500">
                                            {new Date(review.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    {review.title && (
                                        <p className="font-medium text-white mb-1">{review.title}</p>
                                    )}
                                    <p className="text-gray-300 text-sm">{review.comment}</p>

                                    {/* Review Images */}
                                    {review.images && review.images.length > 0 && (
                                        <div className="flex gap-2 mt-3">
                                            {review.images.map((img, idx) => (
                                                <a
                                                    key={idx}
                                                    href={img}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-16 h-16 rounded-lg overflow-hidden bg-zinc-800 hover:opacity-80 transition-opacity"
                                                >
                                                    <img src={getReviewImage(img)} alt={`Review photo ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" />
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
