"use client";

import { useState, useEffect } from "react";
import { History } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getRecentlyViewed, RecentlyViewedItem } from "@/lib/recently-viewed";

export default function RecentlyViewedSection() {
    const [items, setItems] = useState<RecentlyViewedItem[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setItems(getRecentlyViewed().slice(0, 4)); // Show max 4
    }, []);

    if (!mounted || items.length === 0) return null;

    return (
        <section className="py-12 bg-black border-t border-zinc-800">
            <div className="container mx-auto px-4">
                <div className="flex items-center gap-3 mb-6">
                    <History className="text-red-500" size={24} />
                    <h2 className="text-2xl font-bold text-white">Recently Viewed</h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {items.map((item) => (
                        <Link
                            key={item.id}
                            href={`/product/${item.slug}`}
                            className="group block"
                        >
                            <div className="bg-zinc-900 border border-zinc-800 rounded overflow-hidden hover:border-red-900 transition-all">
                                <div className="aspect-square relative overflow-hidden bg-zinc-800">
                                    <Image
                                        src={item.image}
                                        alt={item.name}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        unoptimized
                                    />
                                </div>
                                <div className="p-3">
                                    <p className="text-xs text-red-500 uppercase tracking-widest font-semibold mb-1">
                                        {item.category}
                                    </p>
                                    <h3 className="text-sm font-bold text-white truncate mb-1">
                                        {item.name}
                                    </h3>
                                    <p className="text-red-500 font-bold">₹{item.price}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
