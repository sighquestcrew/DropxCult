"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { toggleWishlist, isInWishlist, WishlistItem } from "@/lib/wishlist";
import { toast } from "sonner";

interface WishlistButtonProps {
    product: {
        id: string;
        name: string;
        price: number;
        image?: string;
        images?: string[];
        slug: string;
        sizes?: string[];
    };
    className?: string;
    size?: number;
}

export default function WishlistButton({ product, className = "", size = 20 }: WishlistButtonProps) {
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setIsWishlisted(isInWishlist(product.id));

        // Listen for wishlist updates
        const handleUpdate = () => {
            setIsWishlisted(isInWishlist(product.id));
        };
        window.addEventListener("wishlist-updated", handleUpdate);
        return () => window.removeEventListener("wishlist-updated", handleUpdate);
    }, [product.id]);

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const image = product.image || product.images?.[0] || "/placeholder.png";

        const item: WishlistItem = {
            id: product.id,
            name: product.name,
            price: product.price,
            image,
            slug: product.slug,
            sizes: product.sizes,
        };

        const added = toggleWishlist(item);
        setIsWishlisted(added);

        if (added) {
            toast.success("Added to wishlist");
        } else {
            toast.success("Removed from wishlist");
        }
    };

    if (!mounted) {
        return (
            <button className={`opacity-50 ${className}`} disabled>
                <Heart size={size} />
            </button>
        );
    }

    return (
        <button
            onClick={handleClick}
            className={`transition-all duration-200 hover:scale-110 ${className}`}
            title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
            <Heart
                size={size}
                className={isWishlisted ? "fill-red-500 text-red-500" : "text-white hover:text-red-400"}
            />
        </button>
    );
}
