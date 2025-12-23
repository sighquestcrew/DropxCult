"use client";

import { useState, useEffect } from "react";
import { Heart, ShoppingBag, Trash2, ArrowLeft, X, Minus, Plus, Ruler } from "lucide-react";
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
    category?: string; // tshirt, hoodie, etc.
    garmentType?: string;
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

const SIZES = ["S", "M", "L", "XL", "XXL"];

// Size Charts - Different charts for different product types
const SIZE_CHARTS = {
    // Drop-shoulder T-Shirts (Default)
    tshirt: {
        title: "Oversized T-Shirt Size Chart",
        headers: ["Size", "Chest (in)", "Length (in)", "Shoulder (in)", "Sleeve (in)"],
        rows: [
            ["S", "42", "27.5", "20", "8.5"],
            ["M", "44", "28", "21", "9"],
            ["L", "46", "28.5", "22", "9.5"],
            ["XL", "48", "29", "23", "10"],
            ["XXL", "50", "29.5", "24", "10.5"],
        ],
        recommendations: [
            { height: "5'4\" - 5'6\"", weight: "50-60kg", size: "S" },
            { height: "5'6\" - 5'9\"", weight: "60-70kg", size: "M" },
            { height: "5'9\" - 5'11\"", weight: "70-80kg", size: "L" },
            { height: "5'11\" - 6'1\"", weight: "80-90kg", size: "XL" },
            { height: "6'1\"+", weight: "90kg+", size: "XXL" },
        ],
        note: "All measurements in inches. Expect tolerance by ± 1 inch."
    },
    // Hoodies/Sweatshirts
    hoodie: {
        title: "Hoodie/Sweatshirt Size Chart",
        headers: ["Size", "Chest (in)", "Length (in)", "Shoulder (in)", "Sleeve (in)"],
        rows: [
            ["S", "38", "27", "16.5", "23.5"],
            ["M", "40", "28", "17.5", "24"],
            ["L", "42", "29", "18.5", "24.5"],
            ["XL", "44", "30", "19.5", "25"],
            ["XXL", "46", "31", "20.5", "25.5"],
        ],
        recommendations: [
            { height: "5'4\" - 5'6\"", weight: "50-60kg", size: "S" },
            { height: "5'6\" - 5'9\"", weight: "60-70kg", size: "M" },
            { height: "5'9\" - 5'11\"", weight: "70-80kg", size: "L" },
            { height: "5'11\" - 6'1\"", weight: "80-90kg", size: "XL" },
            { height: "6'1\"+", weight: "90kg+", size: "XXL" },
        ],
        note: "All measurements in inches. Expect tolerance by ± 1 inch."
    }
};

// Helper to get correct size chart based on product name/category
const getSizeChart = (item: WishlistItem) => {
    // 1. Check garmentType (New preferred method)
    if (item.garmentType === 'Hoodie') {
        return SIZE_CHARTS.hoodie;
    }

    // 2. Check category (Legacy)
    if (item.category) {
        const key = item.category.toLowerCase();
        if (key.includes('hoodie') || key.includes('sweatshirt')) {
            return SIZE_CHARTS.hoodie;
        }
    }
    // 3. Check name keywords (Fallback)
    const name = item.name.toLowerCase();
    if (name.includes('hoodie') || name.includes('sweatshirt') || name.includes('hood')) {
        return SIZE_CHARTS.hoodie;
    }
    return SIZE_CHARTS.tshirt; // Default
};

export default function WishlistPage() {
    const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
    const [mounted, setMounted] = useState(false);
    const [selectedItem, setSelectedItem] = useState<WishlistItem | null>(null);
    const [selectedSize, setSelectedSize] = useState("");
    const [qty, setQty] = useState(1);
    const [showSizeChart, setShowSizeChart] = useState(false);
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

    const openSizeModal = (item: WishlistItem) => {
        setSelectedItem(item);
        setSelectedSize("");
        setQty(1);
        setShowSizeChart(false);
    };

    const addToCartHandler = () => {
        if (!selectedItem || !selectedSize) {
            toast.error("Please select a size");
            return;
        }
        dispatch(addToCart({
            id: selectedItem.id,
            name: selectedItem.name,
            slug: selectedItem.slug,
            price: selectedItem.price,
            image: selectedItem.image,
            size: selectedSize,
            qty: qty,
        }));
        toast.success(`Added ${selectedItem.name} to cart!`);
        setSelectedItem(null);
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
                                        onClick={() => openSizeModal(item)}
                                        className="w-full bg-white text-black py-3 rounded-lg font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <ShoppingBag size={18} />
                                        Select Size & Add
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Size Selection Modal */}
            {selectedItem && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                            <h2 className="text-xl font-bold">Select Size</h2>
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="p-2 hover:bg-zinc-800 rounded-full transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Product Info */}
                        <div className="p-4 flex gap-4 border-b border-zinc-800">
                            <div className="w-20 h-20 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                                <Image
                                    src={selectedItem.image}
                                    alt={selectedItem.name}
                                    width={80}
                                    height={80}
                                    className="w-full h-full object-cover"
                                    unoptimized
                                />
                            </div>
                            <div>
                                <h3 className="font-semibold">{selectedItem.name}</h3>
                                <p className="text-red-500 font-bold text-lg">₹{selectedItem.price}</p>
                            </div>
                        </div>

                        {/* Size Selection */}
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-medium">Size</span>
                                <button
                                    onClick={() => setShowSizeChart(!showSizeChart)}
                                    className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                >
                                    <Ruler size={14} />
                                    Size Chart
                                </button>
                            </div>
                            <div className="grid grid-cols-5 gap-2">
                                {SIZES.map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => setSelectedSize(size)}
                                        className={`py-3 rounded-lg border font-medium transition ${selectedSize === size
                                            ? "border-red-500 bg-red-500/20 text-red-400"
                                            : "border-zinc-700 hover:border-zinc-500"
                                            }`}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>

                            {/* Size Chart */}
                            {showSizeChart && selectedItem && (() => {
                                const sizeChart = getSizeChart(selectedItem);
                                return (
                                    <div className="mt-4 p-4 bg-zinc-800 rounded-lg">
                                        <h4 className="font-medium mb-3">{sizeChart.title}</h4>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="text-gray-400 border-b border-zinc-700">
                                                        {sizeChart.headers.map((header) => (
                                                            <th key={header} className="py-2 px-2 text-left font-medium">{header}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {sizeChart.rows.map((row) => (
                                                        <tr key={row[0]} className="border-b border-zinc-700/50 hover:bg-zinc-700/30">
                                                            {row.map((cell, idx) => (
                                                                <td key={idx} className={`py-2 px-2 ${idx === 0 ? 'font-medium' : ''}`}>{cell}</td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Size Recommendations */}
                                        <div className="mt-4 pt-3 border-t border-zinc-700">
                                            <h5 className="text-sm font-medium text-gray-400 mb-2">Recommended Fit</h5>
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                {sizeChart.recommendations.map((rec) => (
                                                    <div key={rec.size} className="flex items-center gap-2 py-1">
                                                        <span className="font-bold text-red-400">{rec.size}</span>
                                                        <span className="text-gray-400">{rec.height}, {rec.weight}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <p className="text-xs text-gray-500 mt-3">{sizeChart.note}</p>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Quantity */}
                        <div className="p-4 border-t border-zinc-800">
                            <span className="font-medium mb-3 block">Quantity</span>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setQty(Math.max(1, qty - 1))}
                                    className="w-10 h-10 rounded-full border border-zinc-700 flex items-center justify-center hover:bg-zinc-800"
                                >
                                    <Minus size={16} />
                                </button>
                                <span className="text-xl font-bold w-8 text-center">{qty}</span>
                                <button
                                    onClick={() => setQty(qty + 1)}
                                    className="w-10 h-10 rounded-full border border-zinc-700 flex items-center justify-center hover:bg-zinc-800"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Add to Cart Button */}
                        <div className="p-4 border-t border-zinc-800">
                            <button
                                onClick={addToCartHandler}
                                disabled={!selectedSize}
                                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold transition flex items-center justify-center gap-2"
                            >
                                <ShoppingBag size={20} />
                                Add to Cart - ₹{selectedItem.price * qty}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

