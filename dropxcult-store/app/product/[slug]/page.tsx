"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { addToCart } from "@/redux/slices/cartSlice";
import { toast } from "sonner";
import { Loader2, Minus, Plus, ShoppingBag, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import Link from "next/link";

// Add JSON-LD Structured Data Helper
function generateProductSchema(product: any) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description || `${product.name} - Premium streetwear inspired by ancient mythology`,
    "image": product.images,
    "sku": product.id,
    "brand": {
      "@type": "Brand",
      "name": "DropXCult"
    },
    "offers": {
      "@type": "Offer",
      "url": `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/product/${product.slug}`,
      "priceCurrency": "INR",
      "price": product.price,
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": "DropXCult"
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "127"
    }
  };
}

function generateBreadcrumbSchema(product: any) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Shop",
        "item": `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/shop`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": product.category,
        "item": `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/shop?category=${product.category}`
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": product.name
      }
    ]
  };
}

export default function ProductPage() {
  const { slug } = useParams();
  const dispatch = useDispatch();

  const [selectedSize, setSelectedSize] = useState("");
  const [qty, setQty] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Fetch product data
  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data } = await axios.get(`/api/products/${slug}`);
      return data;
    },
    enabled: !!slug,
  });

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error("Please select a size first!");
      return;
    }

    if (product) {
      dispatch(addToCart({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        image: product.images[0],
        size: selectedSize,
        qty: qty
      }));
      toast.success(`Added ${product.name} to Cart`);
    }
  };

  const nextImage = () => {
    if (product) {
      setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
    }
  };

  const prevImage = () => {
    if (product) {
      setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
    }
  };

  // Inject JSON-LD structured data and update page title
  useEffect(() => {
    if (product) {
      // Update page title dynamically
      document.title = `${product.name} - ₹${product.price} | DropXCult`;

      // Add meta description
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', product.description || `Buy ${product.name} at DropXCult. Premium ${product.category} streetwear inspired by ancient mythology. Price: ₹${product.price}. Available in sizes ${product.sizes.join(', ')}.`);

      // Inject Product Schema
      const productSchemaScript = document.createElement('script');
      productSchemaScript.type = 'application/ld+json';
      productSchemaScript.text = JSON.stringify(generateProductSchema(product));
      productSchemaScript.id = 'product-schema';

      // Inject Breadcrumb Schema
      const breadcrumbSchemaScript = document.createElement('script');
      breadcrumbSchemaScript.type = 'application/ld+json';
      breadcrumbSchemaScript.text = JSON.stringify(generateBreadcrumbSchema(product));
      breadcrumbSchemaScript.id = 'breadcrumb-schema';

      // Remove old schemas if they exist
      const oldProductSchema = document.getElementById('product-schema');
      const oldBreadcrumbSchema = document.getElementById('breadcrumb-schema');
      if (oldProductSchema) oldProductSchema.remove();
      if (oldBreadcrumbSchema) oldBreadcrumbSchema.remove();

      document.head.appendChild(productSchemaScript);
      document.head.appendChild(breadcrumbSchemaScript);
    }
  }, [product]);

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-red-600" /></div>;
  if (!product) return <div className="h-screen flex items-center justify-center bg-black text-white">Product Not Found</div>;

  return (
    <div className="min-h-screen bg-black text-white pt-6 pb-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 max-w-7xl mx-auto">

          {/* Left: Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square overflow-hidden bg-zinc-900 border border-zinc-800 rounded group">
              <Image
                src={product.images[currentImageIndex]}
                alt={product.name}
                fill
                className="object-cover"
                priority
                unoptimized
              />

              {/* Navigation Arrows (only if multiple images) */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`aspect-square relative overflow-hidden bg-zinc-900 border rounded transition-all ${currentImageIndex === idx ? "border-white ring-2 ring-white" : "border-zinc-800 hover:border-zinc-600"
                      }`}
                  >
                    <Image src={img} alt={`${product.name} ${idx + 1}`} fill className="object-cover" unoptimized />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Details */}
          <div className="flex flex-col space-y-6 lg:space-y-8">
            {/* Product Info */}
            <div>
              <div className="text-xs text-red-500 font-bold uppercase tracking-widest mb-2">{product.category}</div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-3">{product.name}</h1>
              <p className="text-2xl text-white font-bold">₹{product.price}</p>
            </div>

            {/* Description */}
            {product.description && (
              <div className="text-gray-400 leading-relaxed border-l-4 border-red-900 pl-4 text-sm sm:text-base">
                {product.description}
              </div>
            )}

            {/* View in 3D Button (only for 3D designs) */}
            {product.is3DDesign && (
              <Link
                href={`${process.env.NEXT_PUBLIC_EDITOR_URL || 'http://localhost:3000'}?designId=${product.id}&viewOnly=true`}
                target="_blank"
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 px-6 rounded font-bold uppercase tracking-wider transition-colors"
              >
                <Eye size={18} />
                View in 3D
              </Link>
            )}

            {/* Size Selector */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Select Size</h3>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size: string) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`h-11 w-11 sm:h-12 sm:w-12 flex items-center justify-center border transition-all font-bold text-sm
                      ${selectedSize === size
                        ? "bg-white text-black border-white scale-105"
                        : "bg-transparent text-gray-400 border-zinc-700 hover:border-gray-400 hover:text-white"
                      }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity & Add Button */}
            <div className="flex items-center gap-3 pt-2">
              {/* Quantity Counter */}
              <div className="flex items-center border border-zinc-700 h-10 px-3 space-x-3 rounded">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="text-gray-400 hover:text-white transition">
                  <Minus size={14} />
                </button>
                <span className="font-bold w-6 text-center text-sm">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="text-gray-400 hover:text-white transition">
                  <Plus size={14} />
                </button>
              </div>

              {/* Add To Cart Button */}
              <button
                onClick={handleAddToCart}
                className="flex-1 h-10 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors text-xs rounded"
              >
                <ShoppingBag size={14} />
                Add to Cart
              </button>
            </div>

            {/* Product Details */}
            <div className="border-t border-zinc-800 pt-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">SKU:</span>
                <span className="text-white font-mono">{product.id.substring(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Category:</span>
                <span className="text-white">{product.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Availability:</span>
                <span className="text-green-500 font-bold">In Stock</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}