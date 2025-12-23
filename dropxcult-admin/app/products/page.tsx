"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Loader2, Trash2, Plus, Edit, Star } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import Link from "next/link";
import Pagination from "@/components/Pagination";
import { SearchInput, SelectFilter } from "@/components/Filters";
import ExportButton from "@/components/ExportButton";

export default function AdminProductsPage() {
    const queryClient = useQueryClient();

    // Filter state
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("");
    const [page, setPage] = useState(1);
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

    // Fetch products with filters
    const { data, isLoading } = useQuery({
        queryKey: ["admin-products", search, category, page],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            if (category) params.set("category", category);
            params.set("page", String(page));
            params.set("limit", "10");

            const { data } = await axios.get(`/api/products?${params.toString()}`);
            return data;
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await axios.delete(`/api/products/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-products"] });
            toast.success("Product deleted successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || "Failed to delete product");
        },
    });

    // Bulk delete mutation
    const bulkDeleteMutation = useMutation({
        mutationFn: async (ids: string[]) => {
            await Promise.all(ids.map(id => axios.delete(`/api/products/${id}`)));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-products"] });
            setSelectedProducts([]);
            toast.success("Products deleted successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || "Failed to delete products");
        },
    });

    const products = data?.products || [];
    const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };
    const categories = data?.categories || [];

    const handleSelectAll = () => {
        if (selectedProducts.length === products.length) {
            setSelectedProducts([]);
        } else {
            setSelectedProducts(products.map((p: any) => p.id));
        }
    };

    const handleSelect = (id: string) => {
        setSelectedProducts(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    // Category options for filter
    const categoryOptions = [
        { value: "", label: "All Categories" },
        ...categories.map((c: any) => ({ value: c.name, label: `${c.name} (${c.count})` }))
    ];

    // Export columns
    const exportColumns = [
        { key: "id", header: "ID" },
        { key: "name", header: "Name" },
        { key: "price", header: "Price" },
        { key: "category", header: "Category" },
        { key: "stock", header: "Stock" },
        { key: "isFeatured", header: "Featured" },
    ];

    if (isLoading) {
        return (
            <div className="p-10 text-white">
                <Loader2 className="animate-spin h-8 w-8 text-red-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold">Inventory ({pagination.total})</h1>
                <div className="flex items-center gap-3">
                    <ExportButton data={products} filename="products" columns={exportColumns} />
                    <Link href="/products/new">
                        <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center gap-2 font-bold transition">
                            <Plus size={20} />
                            Add Product
                        </button>
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <SearchInput
                    placeholder="Search products..."
                    value={search}
                    onChange={(v) => { setSearch(v); setPage(1); }}
                    className="md:w-80"
                />
                <SelectFilter
                    label=""
                    value={category}
                    options={categoryOptions}
                    onChange={(v) => { setCategory(v); setPage(1); }}
                />
            </div>

            {/* Bulk Actions */}
            {selectedProducts.length > 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center gap-4">
                    <span className="text-sm text-gray-400">{selectedProducts.length} selected</span>
                    <button
                        onClick={() => {
                            if (confirm(`Delete ${selectedProducts.length} products?`)) {
                                bulkDeleteMutation.mutate(selectedProducts);
                            }
                        }}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition"
                    >
                        Delete Selected
                    </button>
                    <button
                        onClick={() => setSelectedProducts([])}
                        className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded transition"
                    >
                        Clear
                    </button>
                </div>
            )}

            {/* Products Table */}
            <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
                <table className="w-full text-left text-gray-400">
                    <thead className="bg-black text-xs uppercase font-bold text-gray-500">
                        <tr>
                            <th className="p-4">
                                <input
                                    type="checkbox"
                                    checked={selectedProducts.length === products.length && products.length > 0}
                                    onChange={handleSelectAll}
                                    className="rounded bg-zinc-800 border-zinc-700"
                                />
                            </th>
                            <th className="p-4">Image</th>
                            <th className="p-4">Name</th>
                            <th className="p-4">Price</th>
                            <th className="p-4">Category</th>
                            <th className="p-4">Stock</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {products.map((product: any) => (
                            <tr key={product.id} className="hover:bg-zinc-800/50 transition">
                                <td className="p-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedProducts.includes(product.id)}
                                        onChange={() => handleSelect(product.id)}
                                        className="rounded bg-zinc-800 border-zinc-700"
                                    />
                                </td>
                                <td className="p-4">
                                    <div className="relative h-12 w-12 bg-zinc-800 rounded overflow-hidden">
                                        <Image
                                            src={product.images[0]}
                                            alt={product.name}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-white">{product.name}</span>
                                        {product.isFeatured && (
                                            <Star size={14} className="text-yellow-500 fill-yellow-500" />
                                        )}
                                    </div>
                                </td>
                                <td className="p-4 text-white font-bold">₹{product.price.toLocaleString()}</td>
                                <td className="p-4">
                                    <span className="bg-zinc-800 text-xs px-2 py-1 rounded text-gray-300">
                                        {product.category}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <span className={`text-sm font-bold ${product.stock > 20 ? "text-green-500" :
                                        product.stock > 5 ? "text-yellow-500" : "text-red-500"
                                        }`}>
                                        {product.stock}
                                    </span>
                                </td>
                                <td className="p-4 text-right space-x-2">
                                    <Link href={`/products/edit/${product.id}`}>
                                        <button className="text-blue-500 hover:text-white transition p-2 hover:bg-blue-600 rounded">
                                            <Edit size={18} />
                                        </button>
                                    </Link>
                                    <button
                                        onClick={() => {
                                            if (confirm("Are you sure you want to delete this product?")) {
                                                deleteMutation.mutate(product.id);
                                            }
                                        }}
                                        className="text-red-500 hover:text-white transition p-2 hover:bg-red-600 rounded"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {products.length === 0 && (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-gray-500">No products found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
            />
        </div>
    );
}
