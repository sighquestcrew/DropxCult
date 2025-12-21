"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import Image from "next/image";

interface SearchResult {
    id: string;
    name: string;
    slug: string;
    price: number;
    images: string[];
    category: string;
}

export default function SearchBar() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Debounced search
    useEffect(() => {
        if (query.trim().length < 2) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const { data } = await axios.get(`/api/products/search?q=${encodeURIComponent(query)}`);
                setResults(data.slice(0, 5)); // Max 5 results
            } catch (error) {
                console.error("Search error:", error);
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/shop?search=${encodeURIComponent(query)}`);
            setIsOpen(false);
            setQuery("");
        }
    };

    const handleResultClick = () => {
        setIsOpen(false);
        setQuery("");
    };

    return (
        <div ref={containerRef} className="relative">
            <form onSubmit={handleSubmit} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder="Search..."
                    className="w-40 lg:w-56 bg-zinc-900 border border-zinc-700 rounded-full pl-10 pr-8 py-2 text-sm text-white placeholder-gray-500 focus:border-red-500 focus:outline-none transition-all"
                />
                {query && (
                    <button
                        type="button"
                        onClick={() => {
                            setQuery("");
                            setResults([]);
                            inputRef.current?.focus();
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                        <X size={16} />
                    </button>
                )}
            </form>

            {/* Dropdown Results */}
            {isOpen && query.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden z-50">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="animate-spin text-gray-400" size={20} />
                        </div>
                    ) : results.length > 0 ? (
                        <>
                            {results.map((product) => (
                                <Link
                                    key={product.id}
                                    href={`/product/${product.slug}`}
                                    onClick={handleResultClick}
                                    className="flex items-center gap-3 p-3 hover:bg-zinc-800 transition-colors"
                                >
                                    <div className="w-12 h-12 relative rounded overflow-hidden bg-zinc-800 shrink-0">
                                        <Image
                                            src={product.images[0]}
                                            alt={product.name}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">{product.name}</p>
                                        <p className="text-xs text-gray-400">{product.category}</p>
                                    </div>
                                    <p className="text-sm font-bold text-red-500">₹{product.price}</p>
                                </Link>
                            ))}
                            <Link
                                href={`/shop?search=${encodeURIComponent(query)}`}
                                onClick={handleResultClick}
                                className="block text-center py-3 text-sm text-red-500 hover:bg-zinc-800 border-t border-zinc-700"
                            >
                                View all results →
                            </Link>
                        </>
                    ) : (
                        <div className="py-8 text-center text-gray-400 text-sm">
                            No products found for "{query}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
