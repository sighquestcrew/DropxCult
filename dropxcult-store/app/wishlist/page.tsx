"use client";

import { useState, useEffect } from "react";
import { Heart, ShoppingBag, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useDispatch } from "react-redux";
import { addToCart } from "@/redux/slices/cartSlice";
import { toast } from "sonner";

interface WishlistItem {
    id: string;
    name: string;
    price: number;
    image: string;
    slug: string;
    sizes?: string[];
}

// Get wishlist from localStorage
const getWishlist = (): WishlistItem[] => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem("wishlist");
    return saved ? JSON.parse(saved) : [];
};

// Save wishlist to localStorage
const saveWishlist = (items: WishlistItem[]) => {
    localStorage.setItem("wishlist", JSON.stringify(items));
};

export default function WishlistPage() {
    const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
    const [mounted, setMounted] = useState(false);
    const dispatch = useDispatch();

    useEffect(() => {
        setMounted(true);
        setWishlist(getWishlist());
    }, []);

    const removeFromWishlist = (id: string) => {
        const updated = wishlist.filter(item => item.id !== id);
        setWishlist(updated);
        saveWishlist(updated);
        toast.success("Removed from wishlist");
    };

    const addToCartHandler = (item: WishlistItem) => {
        dispatch(addToCart({
            _id: item.id,
            name: item.name,
            price: item.price,
            image: item.image,
            qty: 1,
            size: item.sizes?.[0] || "M",
        }));
        toast.success("Added to cart!");
    };

    const clearWishlist = () => {
        setWishlist([]);
        saveWishlist([]);
        toast.success("Wishlist cleared");
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-black text-white py-12">
            <div className="container mx-auto px-4 max-w-5xl">
                {/* Back Link */}
                <Link href="/shop" className="flex items-center text-gray-400 hover:text-white mb-8 transition-colors">
                    <ArrowLeft size={18} className="mr-2" />
                    Continue Shopping
                </Link>

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-600/20 rounded-full flex items-center justify-center">
                            <Heart className="text-red-500" size={24} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">My Wishlist</h1>
                            <p className="text-gray-400">{wishlist.length} items saved</p>
                        </div>
                    </div>
                    {wishlist.length > 0 && (
                        <button
                            onClick={clearWishlist}
                            className="text-sm text-red-500 hover:text-red-400 flex items-center gap-2"
                        >
                            <Trash2 size={16} />
                            Clear All
                        </button>
                    )}
                </div>

                {/* Empty State */}
                {wishlist.length === 0 ? (
                    <div className="text-center py-20 bg-zinc-900 border border-zinc-800 rounded-xl">
                        <Heart size={64} className="mx-auto mb-4 text-gray-600" />
                        <h2 className="text-xl font-bold mb-2">Your wishlist is empty</h2>
                        <p className="text-gray-400 mb-6">Save items you love to buy them later</p>
                        <Link
                            href="/shop"
                            className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-lg font-bold hover:bg-gray-200 transition-colors"
                        >
                            <ShoppingBag size={18} />
                            Browse Products
                        </Link>
                    </div>
                ) : (
                    /* Wishlist Grid */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {wishlist.map((item) => (
                            <div
                                key={item.id}
                                className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden group"
                            >
                                {/* Image */}
                                <Link href={`/product/${item.slug}`} className="block relative aspect-square overflow-hidden">
                                    <Image
                                        src={item.image}
                                        alt={item.name}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        unoptimized
                                    />
                                    {/* Remove Button */}
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            removeFromWishlist(item.id);
                                        }}
                                        className="absolute top-3 right-3 w-10 h-10 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                                    >
                                        <Heart size={20} className="fill-red-500 text-red-500" />
                                    </button>
                                </Link>

                                {/* Content */}
                                <div className="p-4">
                                    <Link href={`/product/${item.slug}`}>
                                        <h3 className="font-semibold mb-1 hover:text-red-500 transition-colors truncate">
                                            {item.name}
                                        </h3>
                                    </Link>
                                    <p className="text-red-500 font-bold text-lg mb-4">₹{item.price}</p>
                                    <button
                                        onClick={() => addToCartHandler(item)}
                                        className="w-full bg-white text-black py-3 rounded-lg font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <ShoppingBag size={18} />
                                        Add to Cart
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
