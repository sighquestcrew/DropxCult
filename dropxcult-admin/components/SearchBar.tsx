"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Search, X, Package, ShoppingBag, Users, Loader2, Palette } from "lucide-react";
import Link from "next/link";

interface SearchResult {
    products: { id: string; name: string; category: string }[];
    orders: { id: string; totalPrice: number; status: string }[];
    users: { id: string; name: string; email: string }[];
    designs: { id: string; name: string; status: string }[];
}

export default function SearchBar() {
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const { data, isLoading } = useQuery<SearchResult>({
        queryKey: ["global-search", query],
        queryFn: async () => {
            if (!query.trim()) return { products: [], orders: [], users: [], designs: [] };
            const { data } = await axios.get(`/api/search?q=${encodeURIComponent(query)}`);
            return data;
        },
        enabled: query.length >= 2,
    });

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Open dropdown when typing
    useEffect(() => {
        if (query.length >= 2) setIsOpen(true);
    }, [query]);

    const hasResults = data && (data.products.length > 0 || data.orders.length > 0 || data.users.length > 0 || data.designs.length > 0);

    const handleResultClick = () => {
        setIsOpen(false);
        setQuery("");
    };

    return (
        <div ref={containerRef} className="relative w-full max-w-md">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length >= 2 && setIsOpen(true)}
                    placeholder="Search products, orders, users, designs..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-10 py-2.5 text-white placeholder-gray-500 focus:border-red-600 focus:outline-none transition"
                />
                {query && (
                    <button
                        onClick={() => {
                            setQuery("");
                            inputRef.current?.focus();
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Dropdown Results */}
            {isOpen && query.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-50 max-h-[400px] overflow-y-auto">
                    {isLoading ? (
                        <div className="p-4 flex items-center justify-center text-gray-400">
                            <Loader2 className="animate-spin" size={20} />
                        </div>
                    ) : !hasResults ? (
                        <div className="p-4 text-center text-gray-500">No results found for "{query}"</div>
                    ) : (
                        <div className="divide-y divide-zinc-800">
                            {/* Products */}
                            {data.products.length > 0 && (
                                <div className="p-2">
                                    <div className="flex items-center gap-2 px-2 py-1 text-xs text-gray-500 uppercase font-bold">
                                        <ShoppingBag size={12} /> Products
                                    </div>
                                    {data.products.slice(0, 5).map((product) => (
                                        <Link
                                            key={product.id}
                                            href={`/products/edit/${product.id}`}
                                            onClick={handleResultClick}
                                            className="block px-3 py-2 rounded hover:bg-zinc-800 transition"
                                        >
                                            <div className="text-white font-medium">{product.name}</div>
                                            <div className="text-xs text-gray-500">{product.category}</div>
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {/* Orders */}
                            {data.orders.length > 0 && (
                                <div className="p-2">
                                    <div className="flex items-center gap-2 px-2 py-1 text-xs text-gray-500 uppercase font-bold">
                                        <Package size={12} /> Orders
                                    </div>
                                    {data.orders.slice(0, 5).map((order) => (
                                        <Link
                                            key={order.id}
                                            href={`/orders`}
                                            onClick={handleResultClick}
                                            className="block px-3 py-2 rounded hover:bg-zinc-800 transition"
                                        >
                                            <div className="text-white font-medium font-mono text-sm">{order.id.substring(0, 12)}...</div>
                                            <div className="text-xs text-gray-500">₹{order.totalPrice} • {order.status}</div>
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {/* Users */}
                            {data.users.length > 0 && (
                                <div className="p-2">
                                    <div className="flex items-center gap-2 px-2 py-1 text-xs text-gray-500 uppercase font-bold">
                                        <Users size={12} /> Users
                                    </div>
                                    {data.users.slice(0, 5).map((user) => (
                                        <Link
                                            key={user.id}
                                            href={`/users`}
                                            onClick={handleResultClick}
                                            className="block px-3 py-2 rounded hover:bg-zinc-800 transition"
                                        >
                                            <div className="text-white font-medium">{user.name}</div>
                                            <div className="text-xs text-gray-500">{user.email}</div>
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {/* Designs */}
                            {data.designs.length > 0 && (
                                <div className="p-2">
                                    <div className="flex items-center gap-2 px-2 py-1 text-xs text-gray-500 uppercase font-bold">
                                        <Palette size={12} /> 3D Designs
                                    </div>
                                    {data.designs.slice(0, 5).map((design) => (
                                        <Link
                                            key={design.id}
                                            href={`/3d-designs?search=${encodeURIComponent(design.name)}&id=${design.id}`}
                                            onClick={handleResultClick}
                                            className="block px-3 py-2 rounded hover:bg-zinc-800 transition"
                                        >
                                            <div className="text-white font-medium">{design.name}</div>
                                            <div className="text-xs text-gray-500">{design.status}</div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

