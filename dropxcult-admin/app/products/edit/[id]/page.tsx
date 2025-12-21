"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, UploadCloud, ArrowLeft, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import slugify from "slugify";
import { useQuery } from "@tanstack/react-query";

export default function EditProductPage() {
    const router = useRouter();
    const params = useParams();
    const productId = params.id as string;
    const [uploading, setUploading] = useState(false);
    const [imageUrls, setImageUrls] = useState<string[]>([]);

    const { register, handleSubmit, setValue, watch, formState: { isSubmitting } } = useForm();

    // Fetch existing product data
    const { data: product, isLoading } = useQuery({
        queryKey: ["product", productId],
        queryFn: async () => {
            const { data } = await axios.get(`/api/products?search=`);
            // API returns { products: [...] }, so we need to find in products array
            return data.products?.find((p: any) => p.id === productId) || null;
        },
        enabled: !!productId,
    });

    // Populate form when product data is loaded
    useEffect(() => {
        if (product) {
            setValue("name", product.name);
            setValue("price", product.price);
            setValue("stock", product.stock);
            setValue("category", product.category);
            setValue("description", product.description);
            setImageUrls(product.images || []);
        }
    }, [product, setValue]);

    const nameValue = watch("name");
    const generatedSlug = nameValue ? slugify(nameValue, { lower: true, strict: true }) : product?.slug || "";

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);

        try {
            for (const file of Array.from(files)) {
                const formData = new FormData();
                formData.append("file", file);
                const { data } = await axios.post("/api/upload", formData);
                setImageUrls(prev => [...prev, data.url]);
            }
            toast.success(`${files.length} image(s) uploaded!`);
        } catch (error) {
            toast.error("Image upload failed");
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    const removeImage = (index: number) => {
        setImageUrls(prev => prev.filter((_, i) => i !== index));
    };

    const onSubmit = async (data: any) => {
        try {
            if (imageUrls.length === 0) {
                toast.error("Please upload at least one image");
                return;
            }

            await axios.put(`/api/products/${productId}`, {
                ...data,
                slug: generatedSlug,
                images: imageUrls,
            });

            toast.success("Product Updated Successfully");
            router.push("/products");
        } catch (error) {
            toast.error("Failed to update product");
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="animate-spin h-8 w-8 text-red-600" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <Link href="/products" className="flex items-center text-gray-400 hover:text-white mb-6 transition">
                <ArrowLeft size={18} className="mr-2" />
                Back to Inventory
            </Link>

            <h1 className="text-3xl font-bold mb-8">Edit Product</h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-zinc-900 p-8 rounded border border-zinc-800">

                {/* Name */}
                <div>
                    <label className="block text-sm font-bold text-gray-400 mb-1">Product Name</label>
                    <input
                        {...register("name", { required: true })}
                        className="w-full bg-black border border-zinc-700 p-3 rounded text-white focus:border-red-600 outline-none"
                        placeholder="e.g. Phoenix Rising Tee"
                    />
                </div>

                {/* Slug (Auto-generated) */}
                <div>
                    <label className="block text-sm font-bold text-gray-400 mb-1">Slug (URL)</label>
                    <input
                        value={generatedSlug}
                        readOnly
                        className="w-full bg-zinc-800 border border-zinc-700 p-3 rounded text-gray-400 cursor-not-allowed"
                    />
                </div>

                {/* Price, Stock & Category */}
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-1">Price (₹)</label>
                        <input
                            type="number"
                            {...register("price", { required: true })}
                            className="w-full bg-black border border-zinc-700 p-3 rounded text-white focus:border-red-600 outline-none"
                            placeholder="1499"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-1">Stock</label>
                        <input
                            type="number"
                            {...register("stock", { required: true, min: 0 })}
                            className="w-full bg-black border border-zinc-700 p-3 rounded text-white focus:border-red-600 outline-none"
                            placeholder="50"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-1">Category</label>
                        <select
                            {...register("category", { required: true })}
                            className="w-full bg-black border border-zinc-700 p-3 rounded text-white focus:border-red-600 outline-none"
                        >
                            <option value="Four Auspicious Beasts">Four Auspicious Beasts</option>
                            <option value="Mythical Beasts">Mythical Beasts</option>
                            <option value="Limited Edition">Limited Edition</option>
                        </select>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-bold text-gray-400 mb-1">Description</label>
                    <textarea
                        {...register("description", { required: true })}
                        rows={4}
                        className="w-full bg-black border border-zinc-700 p-3 rounded text-white focus:border-red-600 outline-none"
                        placeholder="Tell the myth behind this design..."
                    />
                </div>

                {/* Multiple Image Upload */}
                <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">
                        Product Images ({imageUrls.length} uploaded)
                    </label>

                    {/* Image Preview Grid */}
                    {imageUrls.length > 0 && (
                        <div className="grid grid-cols-4 gap-3 mb-4">
                            {imageUrls.map((url, index) => (
                                <div key={index} className="relative aspect-square rounded overflow-hidden border border-zinc-700 group">
                                    <Image src={url} alt={`Preview ${index + 1}`} fill className="object-cover" unoptimized />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={14} />
                                    </button>
                                    {index === 0 && (
                                        <span className="absolute bottom-1 left-1 bg-black/80 text-xs text-white px-2 py-0.5 rounded">
                                            Main
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <label className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 rounded flex items-center gap-2 transition border border-zinc-700 w-fit">
                        {uploading ? <Loader2 className="animate-spin" /> : <UploadCloud />}
                        {uploading ? "Uploading..." : "Add Images"}
                        <input
                            type="file"
                            onChange={handleImageUpload}
                            className="hidden"
                            accept="image/*"
                            multiple
                        />
                    </label>
                    <p className="text-xs text-gray-500 mt-2">First image will be used as the main product image</p>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting || uploading}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-12 mt-4 uppercase tracking-widest transition-colors flex items-center justify-center rounded"
                >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : "UPDATE PRODUCT"}
                </button>
            </form>
        </div>
    );
}
