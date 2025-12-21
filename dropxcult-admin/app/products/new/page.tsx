"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, UploadCloud, ArrowLeft, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import slugify from "slugify";

export default function NewProductPage() {
    const router = useRouter();
    const [uploading, setUploading] = useState(false);
    const [imageUrls, setImageUrls] = useState<string[]>([]);

    const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm();

    // Auto-generate slug when name changes
    const nameValue = watch("name");
    const generatedSlug = nameValue ? slugify(nameValue, { lower: true, strict: true }) : "";

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);

        try {
            // Upload each file
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
            // Reset input
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

            await axios.post("/api/products", {
                ...data,
                slug: generatedSlug,
                images: imageUrls, // Send all images
            });

            toast.success("Product Created Successfully");
            router.push("/products");
        } catch (error) {
            toast.error("Failed to create product");
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <Link href="/products" className="flex items-center text-gray-400 hover:text-white mb-6 transition">
                <ArrowLeft size={18} className="mr-2" />
                Back to Inventory
            </Link>

            <h1 className="text-3xl font-bold mb-8">Add New Drop</h1>

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

                {/* Price & Category */}
                <div className="grid grid-cols-2 gap-4">
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
                            multiple // Allow multiple files
                        />
                    </label>
                    <p className="text-xs text-gray-500 mt-2">First image will be used as the main product image</p>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting || uploading}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-12 mt-4 uppercase tracking-widest transition-colors flex items-center justify-center rounded"
                >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : "LAUNCH DROP"}
                </button>
            </form>
        </div>
    );
}

