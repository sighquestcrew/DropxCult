"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Loader2, Sparkles, Truck, Users, ChevronDown, Palette, Shield } from "lucide-react";
import { useEffect } from "react";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  category: string;
}

interface Design {
  id: string;
  name: string;
  previewImage: string;
  user: { name: string };
}

import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import { setHasAppNavigation } from "@/redux/slices/uiSlice";

export default function Home() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state: RootState) => state.auth);
  // @ts-ignore
  const { hasAppNavigation } = useSelector((state: RootState) => state.ui || {});

  useEffect(() => {
    // Only redirect if this is a "fresh" visit and not a navigation
    if (userInfo && hasAppNavigation === false) {
      dispatch(setHasAppNavigation(true)); // Mark as visited so redirect doesn't loop
      router.push("/community");
    }
  }, [userInfo, hasAppNavigation, router, dispatch]);

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["products-home"],
    queryFn: async () => {
      const { data } = await axios.get("/api/products?adminOnly=true");
      return data;
    },
  });

  const { data: designs } = useQuery<Design[]>({
    queryKey: ["community-designs-home"],
    queryFn: async () => {
      const { data } = await axios.get("/api/designs?limit=4&status=Accepted");
      return data;
    },
  });

  // Inject JSON-LD structured data for homepage
  useEffect(() => {
    const organizationSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "DropXCult",
      "url": process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001",
      "logo": `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001"}/logo.png`,
      "description": "Premium streetwear inspired by Ancient Mythology and Auspicious Beasts",
      "sameAs": [
        "https://twitter.com/dropxcult",
        "https://instagram.com/dropxcult",
        "https://facebook.com/dropxcult"
      ]
    };

    const websiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "DropXCult",
      "url": process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001",
      "description": "Wear the Myth - Custom Streetwear & Mythology T-Shirts",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001"}/shop?search={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      }
    };

    // Remove old schemas if they exist
    const oldOrgSchema = document.getElementById('organization-schema');
    const oldWebsiteSchema = document.getElementById('website-schema');
    if (oldOrgSchema) oldOrgSchema.remove();
    if (oldWebsiteSchema) oldWebsiteSchema.remove();

    // Inject Organization Schema
    const orgSchemaScript = document.createElement('script');
    orgSchemaScript.type = 'application/ld+json';
    orgSchemaScript.text = JSON.stringify(organizationSchema);
    orgSchemaScript.id = 'organization-schema';

    // Inject Website Schema
    const websiteSchemaScript = document.createElement('script');
    websiteSchemaScript.type = 'application/ld+json';
    websiteSchemaScript.text = JSON.stringify(websiteSchema);
    websiteSchemaScript.id = 'website-schema';

    document.head.appendChild(orgSchemaScript);
    document.head.appendChild(websiteSchemaScript);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <Loader2 className="h-12 w-12 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">

      {/* ========== HERO SECTION ========== */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-900 to-black" />

        {/* Animated Grid */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `linear-gradient(rgba(255,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,0,0,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />

        {/* Video Background */}
        <video
          autoPlay loop muted playsInline
          className="absolute inset-0 w-full h-full object-contain opacity-60"
        >
          <source src="/65f6776adcbc7d17dbd30416_68281335d591a236c7c0fd24_walkingtshirtv3-transcode (1).mp4" type="video/mp4" />
        </video>

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-red-600/20 border border-red-600/50 rounded-full text-red-400 text-sm">
            <Sparkles className="w-4 h-4" />
            New Collection Dropped
          </div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6">
            WEAR THE{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-600 to-orange-500 animate-pulse">
              MYTH
            </span>
          </h1>

          <p className="text-gray-400 text-base md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed px-4">
            Limited edition drops inspired by <span className="text-white font-semibold">Ancient Mythology</span> and <span className="text-white font-semibold">Auspicious Beasts</span>.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center px-4">
            <Link href="/shop">
              <button className="w-full sm:w-auto group bg-red-600 text-white px-6 py-3 font-bold hover:bg-red-700 transition-all uppercase tracking-wider flex items-center justify-center gap-2 rounded-lg text-sm">
                <ShoppingCart className="w-4 h-4" />
                Shop The Drop
              </button>
            </Link>
            <Link href="/customize">
              <button className="w-full sm:w-auto group border border-white/30 text-white px-6 py-3 font-bold hover:bg-white hover:text-black transition-all uppercase tracking-wider flex items-center justify-center gap-2 rounded-lg text-sm">
                <Palette className="w-4 h-4" />
                Design Your Own
              </button>
            </Link>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-8 h-8 text-white/50" />
        </div>
      </section>

      {/* ========== STATS BAR ========== */}
      <section className="bg-zinc-900 border-y border-zinc-800 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 text-center">
            <div>
              <div className="text-3xl font-black text-white">500+</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Unique Designs</div>
            </div>
            <div className="h-8 w-px bg-zinc-700 hidden md:block" />
            <div>
              <div className="text-3xl font-black text-white">10K+</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Shirts Sold</div>
            </div>
            <div className="h-8 w-px bg-zinc-700 hidden md:block" />
            <div>
              <div className="text-3xl font-black text-white">4.9</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Avg Rating</div>
            </div>
            <div className="h-8 w-px bg-zinc-700 hidden md:block" />
            <div>
              <div className="text-3xl font-black text-red-600">Custom</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Your Design</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== CATEGORY CARDS ========== */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-black text-center mb-4">EXPLORE COLLECTIONS</h2>
        <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">Discover our curated collections and find your unique style</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: "Mythology", desc: "Ancient gods & legends" },
            { name: "Street Art", desc: "Urban culture vibes" },
            { name: "Limited Drops", desc: "Exclusive editions" },
          ].map((cat, i) => (
            <Link key={i} href="/shop">
              <div className="group relative h-56 rounded-xl overflow-hidden cursor-pointer border border-zinc-800 hover:border-red-600/50 bg-zinc-900 transition-all">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                  <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-red-500 transition-colors">{cat.name}</h3>
                  <p className="text-gray-500 text-sm mb-4">{cat.desc}</p>
                  <span className="text-sm text-gray-400 border border-zinc-700 px-4 py-2 rounded-full group-hover:border-red-600 group-hover:text-white transition-all">Explore →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ========== LATEST PRODUCTS ========== */}
      <section className="container mx-auto px-4 py-16 bg-zinc-950">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl font-bold tracking-tight border-l-4 border-red-600 pl-4">
            LATEST DROPS
          </h2>
          <Link href="/shop" className="text-red-500 hover:text-red-400 text-sm font-semibold">
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products?.slice(0, 4).map((product) => (
            <Link key={product.id} href={`/product/${product.slug}`}>
              <div className="group bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-red-600/50 transition-all duration-300 hover:-translate-y-2">
                <div className="aspect-square relative overflow-hidden bg-zinc-800">
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    unoptimized
                  />
                </div>
                <div className="p-4">
                  <div className="text-xs text-red-500 mb-1 uppercase tracking-widest font-semibold">
                    {product.category}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 leading-tight group-hover:text-red-400 transition-colors">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-white">₹{product.price}</span>
                    <button className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors">
                      <ShoppingCart className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ========== COMMUNITY DESIGNS ========== */}
      <section className="py-20 bg-zinc-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-4">COMMUNITY CREATIONS</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Designs created by our community. Get inspired or submit your own!</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {designs?.slice(0, 4).map((design, i) => (
              <div key={design.id || i} className="group relative aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-red-600/50 transition-all">
                {design.previewImage ? (
                  <Image src={design.previewImage} alt={design.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                ) : (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                    <Palette className="w-12 h-12 text-zinc-600" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <div>
                    <p className="text-white font-semibold text-sm">{design.name}</p>
                    <p className="text-gray-500 text-xs">by {design.user?.name || "Community"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link href="/customize">
              <button className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 font-bold rounded-lg transition-colors inline-flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Create Your Design
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ========== WHY CHOOSE US ========== */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-black text-center mb-4">WHY DROP<span className="text-red-600">X</span>CULT?</h2>
        <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">More than just clothing - we&apos;re building a community</p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { icon: Shield, title: "Premium Quality", desc: "100% cotton, ethically sourced fabrics" },
            { icon: Palette, title: "Custom Designs", desc: "Create your own or choose community picks" },
            { icon: Users, title: "Community Driven", desc: "Earn royalties from your designs" },
            { icon: Truck, title: "Fast Shipping", desc: "Free delivery on orders over ₹999" },
          ].map((feature, i) => (
            <div key={i} className="group bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 text-center hover:border-red-600/50 hover:bg-zinc-900 transition-all">
              <div className="w-14 h-14 mx-auto mb-4 bg-red-600/20 rounded-xl flex items-center justify-center group-hover:bg-red-600 transition-colors">
                <feature.icon className="w-7 h-7 text-red-500 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-500 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ========== NEWSLETTER CTA ========== */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl py-16 px-8 text-center">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">JOIN THE <span className="text-red-600">CULT</span></h2>
            <p className="text-gray-500 mb-8 max-w-xl mx-auto">Get early access to new drops, exclusive discounts, and community updates.</p>

            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-5 py-4 rounded-lg bg-black border border-zinc-700 text-white placeholder-gray-500 focus:outline-none focus:border-red-600"
              />
              <button className="bg-red-600 text-white px-8 py-4 font-bold rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========== FOOTER SPACER ========== */}
      <div className="h-20" />
    </div>
  );
}