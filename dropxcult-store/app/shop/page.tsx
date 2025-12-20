"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Loader2, Search, ChevronDown, Grid2X2, Grid3x3, LayoutGrid, Filter, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useMemo } from "react";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  category: string;
}

export default function ShopPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [gridCols, setGridCols] = useState(4);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch all products
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const { data } = await axios.get("/api/products");
      return data;
    },
  });

  // Filter Logic
  const filteredProducts = useMemo(() => {
    return products?.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
      return matchesSearch && matchesCategory && matchesPrice;
    });
  }, [products, searchTerm, selectedCategory, priceRange]);

  // Get unique categories
  const categories = useMemo(() => {
    if (!products) return [];
    return ["All", ...Array.from(new Set(products.map(p => p.category)))];
  }, [products]);

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-red-600 h-10 w-10" /></div>;

  return (
    <div className="min-h-screen bg-black text-white pt-6 pb-12">
      <div className="container mx-auto px-4">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tighter mb-2">THE ARCHIVES</h1>
          <p className="text-gray-400 text-sm">Explore all past and present mythology drops.</p>
        </div>

        {/* Mobile Search + Filter Toggle */}
        <div className="lg:hidden flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full bg-zinc-900 border border-zinc-700 py-2 pl-9 pr-3 rounded text-sm focus:border-red-600 outline-none transition text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 px-3 py-2 rounded font-bold text-sm"
          >
            {showFilters ? <X size={16} /> : <Filter size={16} />}
          </button>
        </div>

        <div className="flex lg:flex-row gap-8">

          {/* MOBILE FILTER DRAWER - Slides in from left */}
          {showFilters && (
            <div className="lg:hidden fixed inset-0 z-50">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/70"
                onClick={() => setShowFilters(false)}
              />
              {/* Drawer */}
              <div className="absolute left-0 top-0 h-full w-72 bg-zinc-900 border-r border-zinc-700 p-4 space-y-4 overflow-y-auto animate-slide-in">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg">Filters</h3>
                  <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-zinc-800 rounded">
                    <X size={20} />
                  </button>
                </div>

                {/* Price Range */}
                <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Price Range</h3>
                  <div className="space-y-3">
                    <input
                      type="range"
                      min="0"
                      max="2000"
                      step="100"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                      className="w-full accent-red-600"
                    />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">₹{priceRange[0]}</span>
                      <span className="text-white font-bold">₹{priceRange[1]}</span>
                    </div>
                  </div>
                </div>

                {/* Category Filter */}
                <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider mb-3">Category</h3>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => {
                          setSelectedCategory(category);
                          setShowFilters(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded text-sm transition ${selectedCategory === category
                          ? "bg-red-600 text-white font-bold"
                          : "bg-black text-gray-400 hover:text-white hover:bg-zinc-700"
                          }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Results Count */}
                <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">
                    Showing <span className="text-white font-bold">{filteredProducts?.length || 0}</span> products
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* LEFT SIDEBAR - Desktop only */}
          <aside className="hidden lg:block w-64 flex-shrink-0 space-y-6">

            {/* Search (only visible on desktop) */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <h3 className="text-sm font-bold uppercase tracking-wider mb-3">Search</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full bg-black border border-zinc-700 py-2 pl-9 pr-3 rounded text-sm focus:border-red-600 outline-none transition text-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Price Range */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Price Range</h3>
              <div className="space-y-3">
                <input
                  type="range"
                  min="0"
                  max="2000"
                  step="100"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                  className="w-full accent-red-600"
                />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">₹{priceRange[0]}</span>
                  <span className="text-white font-bold">₹{priceRange[1]}</span>
                </div>
              </div>
            </div>

            {/* Category Filter */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <h3 className="text-sm font-bold uppercase tracking-wider mb-3">Category</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition ${selectedCategory === category
                      ? "bg-red-600 text-white font-bold"
                      : "bg-black text-gray-400 hover:text-white hover:bg-zinc-800"
                      }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Count */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <p className="text-gray-400 text-sm">
                Showing <span className="text-white font-bold">{filteredProducts?.length || 0}</span> products
              </p>
            </div>
          </aside>

          {/* RIGHT SIDE - Products Grid */}
          <main className="flex-1 min-w-0">

            {/* Top Bar - Sort & View Options */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
              <div className="text-sm text-gray-400">
                {filteredProducts?.length || 0} Results
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded p-1">
                <button
                  onClick={() => setGridCols(2)}
                  className={`p-2 rounded transition ${gridCols === 2 ? "bg-zinc-800 text-white" : "text-gray-500 hover:text-white"}`}
                  title="2 columns"
                >
                  <Grid2X2 size={16} />
                </button>
                <button
                  onClick={() => setGridCols(3)}
                  className={`p-2 rounded transition ${gridCols === 3 ? "bg-zinc-800 text-white" : "text-gray-500 hover:text-white"}`}
                  title="3 columns"
                >
                  <Grid3x3 size={16} />
                </button>
                <button
                  onClick={() => setGridCols(4)}
                  className={`p-2 rounded transition ${gridCols === 4 ? "bg-zinc-800 text-white" : "text-gray-500 hover:text-white"}`}
                  title="4 columns"
                >
                  <LayoutGrid size={16} />
                </button>
              </div>
            </div>

            {/* Product Grid */}
            <div className={`grid gap-4 ${gridCols === 2 ? "grid-cols-1 sm:grid-cols-2" :
              gridCols === 3 ? "grid-cols-2 md:grid-cols-3" :
                "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              }`}>
              {filteredProducts?.length === 0 ? (
                <div className="col-span-full text-center py-20 text-gray-500">
                  No designs found matching your criteria.
                </div>
              ) : (
                filteredProducts?.map((product) => (
                  <Link href={`/product/${product.slug}`} key={product.id} className="group block">
                    <div className="bg-zinc-900 border border-zinc-800 overflow-hidden hover:border-red-900 transition-all duration-300 rounded">
                      {/* Image */}
                      <div className="aspect-square relative overflow-hidden bg-zinc-800">
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                      </div>

                      {/* Details */}
                      <div className="p-3">
                        <div className="text-[10px] text-red-500 mb-1 uppercase tracking-widest font-semibold">
                          {product.category}
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-white mb-1 leading-tight truncate">
                          {product.name}
                        </h3>
                        <p className="text-gray-300 text-sm font-bold">₹{product.price}</p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}