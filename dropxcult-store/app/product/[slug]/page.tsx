"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Image from "next/image";
import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { addToCart } from "@/redux/slices/cartSlice";
import { toast } from "sonner";
import { Loader2, Minus, Plus, ShoppingBag, ChevronLeft, ChevronRight, Eye, Ruler, Star, Truck, RotateCcw, ChevronDown, User, X } from "lucide-react";
import Link from "next/link";
import WishlistButton from "@/components/WishlistButton";
import { addToRecentlyViewed } from "@/lib/recently-viewed";
import ReviewSection from "@/components/ReviewSection";
import PreOrderBanner from "@/components/PreOrderBanner";

// Size Charts - Different charts for different product types
const SIZE_CHARTS = {
  // Drop-shoulder T-Shirts (180gsm, 210gsm, 240gsm, AcidWash OS)
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

// Helper to get correct size chart based on product
const getSizeChart = (product: any) => {
  // 1. Explicit Garment Type (New System)
  if (product.garmentType === 'Hoodie') return SIZE_CHARTS.hoodie;

  // 2. Check tshirtType for 3D designs
  if (product.tshirtType === 'hoodie') return SIZE_CHARTS.hoodie;

  // 3. Check category (Legacy fallback)
  const category = (product.category || '').toLowerCase();
  if (category.includes('hoodie') || category.includes('sweatshirt')) return SIZE_CHARTS.hoodie;

  // Default to t-shirt
  return SIZE_CHARTS.tshirt;
};

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
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Fetch product data
  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data } = await axios.get(`/api/products/${slug}`);
      return data;
    },
    enabled: !!slug,
  });

  // Fetch related products
  const { data: relatedProducts } = useQuery({
    queryKey: ["related-products", product?.category],
    queryFn: async () => {
      const { data } = await axios.get(`/api/products?adminOnly=true`);
      return data.filter((p: any) => p.id !== product?.id).slice(0, 4);
    },
    enabled: !!product?.category,
  });

  // Fetch active pre-order campaign for this product
  const { data: campaignData } = useQuery({
    queryKey: ["campaign", product?.id],
    queryFn: async () => {
      const { data } = await axios.get(`/api/preorder-campaigns?productId=${product.id}`);
      return data;
    },
    enabled: !!product?.id,
  });

  const activeCampaign = campaignData?.campaign;

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error("Please select a size first!");
      return;
    }

    if (product) {
      // Check if this is a 3D design for pricing only
      const is3DDesign = product.slug?.startsWith('design-') || product.is3DDesign;

      dispatch(addToCart({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: is3DDesign ? (product.tshirtType === 'oversized' ? 1299 : 999) : product.price,
        image: product.images[0],
        size: selectedSize,
        qty: qty,
        // Products from Shop are NOT custom - they have product pages for reviews
        isCustom: false
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
      document.title = `${product.name} - ₹${product.price} | DropXCult`;

      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', product.description || `Buy ${product.name} at DropXCult. Premium ${product.category} streetwear inspired by ancient mythology. Price: ₹${product.price}. Available in sizes ${product.sizes.join(', ')}.`);

      const productSchemaScript = document.createElement('script');
      productSchemaScript.type = 'application/ld+json';
      productSchemaScript.text = JSON.stringify(generateProductSchema(product));
      productSchemaScript.id = 'product-schema';

      const breadcrumbSchemaScript = document.createElement('script');
      breadcrumbSchemaScript.type = 'application/ld+json';
      breadcrumbSchemaScript.text = JSON.stringify(generateBreadcrumbSchema(product));
      breadcrumbSchemaScript.id = 'breadcrumb-schema';

      const oldProductSchema = document.getElementById('product-schema');
      const oldBreadcrumbSchema = document.getElementById('breadcrumb-schema');
      if (oldProductSchema) oldProductSchema.remove();
      if (oldBreadcrumbSchema) oldBreadcrumbSchema.remove();

      document.head.appendChild(productSchemaScript);
      document.head.appendChild(breadcrumbSchemaScript);

      // Track recently viewed
      addToRecentlyViewed(product);
    }
  }, [product]);

  // Read view mode
  const searchParams = useSearchParams();
  const isViewOnly = searchParams.get('view') === 'admin';

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

              {/* Navigation Arrows */}
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
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-2">
                <span className="text-red-500">{product.category}</span>
                {product.garmentType && (
                  <>
                    <span className="text-gray-600">•</span>
                    <span className="text-gray-400">{product.garmentType}</span>
                  </>
                )}
                {isViewOnly && (
                  <span className="ml-auto bg-yellow-500 text-black px-2 py-0.5 rounded text-[10px] font-bold">PREVIEW MODE</span>
                )}
              </div>
              <div className="flex items-start justify-between gap-4 mb-3">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">{product.name}</h1>
                {!isViewOnly && (
                  <WishlistButton
                    product={product}
                    className="w-12 h-12 bg-zinc-800 hover:bg-zinc-700 rounded-full flex items-center justify-center shrink-0 border border-zinc-700"
                    size={24}
                  />
                )}
              </div>

              {/* Designer Attribution for 3D Designs */}
              {product.is3DDesign && product.designerName && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-xs font-bold">
                    {product.designerName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-400">Custom Design by <span className="text-purple-400 font-semibold">{product.designerName}</span></span>
                </div>
              )}

              {/* Rating - Hidden in View Only */}
              {!isViewOnly && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} size={16} className={star <= 5 ? "text-yellow-500 fill-yellow-500" : "text-gray-600"} />
                    ))}
                  </div>
                  <span className="text-sm text-gray-400">(127 reviews)</span>
                </div>
              )}

              <p className="text-2xl text-white font-bold">
                ₹{product.is3DDesign ? 999 : product.price}
              </p>
            </div>

            {/* Description */}
            {product.description && (
              <div className="text-gray-400 leading-relaxed border-l-4 border-red-900 pl-4 text-sm sm:text-base">
                {product.description}
              </div>
            )}

            {/* View in 3D Button - Highlighted in View Only */}
            {product.is3DDesign && (
              <Link
                href={`${process.env.NEXT_PUBLIC_EDITOR_URL || 'http://localhost:3000'}?designId=${product.id}&viewOnly=true`}
                target="_blank"
                className={`flex items-center justify-center gap-2 text-white py-3 px-6 rounded font-bold uppercase tracking-wider transition-colors ${isViewOnly ? 'bg-blue-600 hover:bg-blue-700 w-full animate-pulse' : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'}`}
              >
                <Eye size={18} />
                {isViewOnly ? "Open 3D Viewer" : "View in 3D"}
              </Link>
            )}

            {/* Pre-Order Campaign Banner - Hidden in View Only */}
            {!isViewOnly && activeCampaign && (
              <PreOrderBanner
                productId={product.id}
                campaign={activeCampaign}
                onPreOrderClick={() => {
                  if (!selectedSize) {
                    toast.error("Please select a size first!");
                    return;
                  }
                  const userInfo = localStorage.getItem("storeUserInfo");
                  if (!userInfo) {
                    toast.error("Please login to pre-order");
                    return;
                  }
                  // Navigate to pre-order checkout
                  window.location.href = `/checkout/preorder?campaignId=${activeCampaign.id}&productId=${product.id}&size=${selectedSize}&qty=${qty}`;
                }}
              />
            )}

            {/* Size Selector & Cart buttons - HIDDEN IN VIEW ONLY */}
            {!isViewOnly && (
              <>
                {/* Size Selector with Chart Link */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Select Size</h3>
                    <button
                      onClick={() => setShowSizeChart(true)}
                      className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1 transition-colors"
                    >
                      <Ruler size={14} />
                      Size Chart
                    </button>
                  </div>
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
                  <div className="flex items-center border border-zinc-700 h-10 px-3 space-x-3 rounded">
                    <button onClick={() => setQty(Math.max(1, qty - 1))} className="text-gray-400 hover:text-white transition">
                      <Minus size={14} />
                    </button>
                    <span className="font-bold w-6 text-center text-sm">{qty}</span>
                    <button onClick={() => setQty(qty + 1)} className="text-gray-400 hover:text-white transition">
                      <Plus size={14} />
                    </button>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock <= 0}
                    className={`flex-1 h-10 font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors text-xs rounded ${product.stock > 0 ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-zinc-700 text-zinc-400 cursor-not-allowed hidden'}`}
                  >
                    <ShoppingBag size={14} />
                    Add to Cart
                  </button>
                </div>
              </>
            )}

            {/* Shipping & Returns Accordion - Always visible but maybe collapsed */}
            <div className="border-t border-zinc-800 pt-4 space-y-2">
              {/* Shipping Info */}
              <button
                onClick={() => setExpandedSection(expandedSection === 'shipping' ? null : 'shipping')}
                className="w-full flex items-center justify-between py-3 text-left hover:text-white transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Truck size={18} className="text-green-500" />
                  <span className="text-sm font-medium">Free Shipping Above ₹999</span>
                </div>
                <ChevronDown size={18} className={`text-gray-500 transition-transform ${expandedSection === 'shipping' ? 'rotate-180' : ''}`} />
              </button>
              {expandedSection === 'shipping' && (
                <div className="pl-9 pb-3 text-sm text-gray-400 space-y-1">
                  <p>• Standard Delivery: 5-7 business days</p>
                  <p>• Express Delivery: 2-3 business days (+₹99)</p>
                  <p>• Pan India shipping available</p>
                </div>
              )}

              {/* Returns Info */}
              <button
                onClick={() => setExpandedSection(expandedSection === 'returns' ? null : 'returns')}
                className="w-full flex items-center justify-between py-3 text-left hover:text-white transition-colors"
              >
                <div className="flex items-center gap-3">
                  <RotateCcw size={18} className={product.is3DDesign ? "text-red-500" : "text-blue-500"} />
                  <span className="text-sm font-medium">{product.is3DDesign ? "No Returns" : "7-Day Easy Returns"}</span>
                </div>
                <ChevronDown size={18} className={`text-gray-500 transition-transform ${expandedSection === 'returns' ? 'rotate-180' : ''}`} />
              </button>
              {expandedSection === 'returns' && (
                <div className="pl-9 pb-3 text-sm text-gray-400 space-y-1">
                  {product.is3DDesign ? (
                    <>
                      <p>• Custom designs are made-to-order</p>
                      <p>• No returns or exchanges available</p>
                      <p>• Please check size chart before ordering</p>
                      <Link href="/shipping" className="text-red-500 hover:underline inline-flex items-center gap-1 mt-2">
                        View full policy →
                      </Link>
                    </>
                  ) : (
                    <>
                      <p>• Hassle-free returns within 7 days</p>
                      <p>• Product must be unworn with tags</p>
                      <p>• Refund processed within 5-7 days</p>
                      <Link href="/shipping" className="text-blue-500 hover:underline inline-flex items-center gap-1 mt-2">
                        View full policy →
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Product Details - Always Visible */}
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
                {product.is3DDesign ? (
                  <div className="text-right">
                    <span className="text-purple-400 font-bold">Made to Order</span>
                    <p className="text-xs text-gray-500 mt-1 max-w-[200px]">
                      Printed after you order. Production: 3-5 days + shipping
                    </p>
                  </div>
                ) : (
                  <div className="text-right">
                    <span className={`font-bold ${product.stock > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
                    </span>
                    {product.stock > 0 && product.stock <= 10 && (
                      <p className="text-xs text-orange-400 mt-1">Only {product.stock} left - Order soon!</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related Products - HIDDEN in View Only */}
        {!isViewOnly && relatedProducts && relatedProducts.length > 0 && (
          <div className="max-w-7xl mx-auto mt-16">
            <h2 className="text-2xl font-bold mb-8">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((p: any) => (
                <Link key={p.id} href={`/product/${p.slug}`} className="group">
                  <div className="aspect-square relative overflow-hidden bg-zinc-900 border border-zinc-800 rounded-lg mb-3">
                    <Image
                      src={p.images?.[0] || '/placeholder.png'}
                      alt={p.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      unoptimized
                    />
                  </div>
                  <h3 className="font-medium text-sm truncate group-hover:text-red-500 transition-colors">{p.name}</h3>
                  <p className="text-red-500 font-bold text-sm">₹{p.price}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Size Chart Modal - HIDDEN in View Only */}
      {!isViewOnly && showSizeChart && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowSizeChart(false)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Ruler size={20} className="text-red-500" />
                {getSizeChart(product).title}
              </h3>
              <button onClick={() => setShowSizeChart(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            {/* Size Table */}
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-700">
                    {getSizeChart(product).headers.map((h) => (
                      <th key={h} className="py-3 px-2 text-left font-semibold text-gray-300">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {getSizeChart(product).rows.map((row, idx) => (
                    <tr key={idx} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                      {row.map((cell, cellIdx) => (
                        <td key={cellIdx} className={`py-3 px-2 ${cellIdx === 0 ? 'font-bold text-white' : 'text-gray-400'}`}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Recommendations */}
            <div>
              <h4 className="font-semibold mb-3 text-gray-300">Size Recommendations</h4>
              <div className="space-y-2">
                {getSizeChart(product).recommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-zinc-800/50 rounded px-4 py-2 text-sm">
                    <span className="text-gray-400">{rec.height}, {rec.weight}</span>
                    <span className="font-bold text-white bg-red-600 px-3 py-1 rounded">{rec.size}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-4 text-center">{getSizeChart(product).note}</p>
            </div>
          </div>
        </div>
      )}

      {/* Reviews Section - HIDDEN or Read Only? Let's hide for clean view */}
      {!isViewOnly && product && (
        <div className="max-w-6xl mx-auto px-4 pb-12">
          {product.slug?.startsWith('design-') ? (
            <ReviewSection designId={product.id} />
          ) : (
            <ReviewSection productId={product.id} />
          )}
        </div>
      )}
    </div>
  );
}