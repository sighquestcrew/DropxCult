// Recently Viewed Products utility using localStorage

export interface RecentlyViewedItem {
    id: string;
    name: string;
    slug: string;
    price: number;
    image: string;
    category: string;
    viewedAt: number;
}

const STORAGE_KEY = "recently_viewed";
const MAX_ITEMS = 10;

// Get recently viewed products
export function getRecentlyViewed(): RecentlyViewedItem[] {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];

    try {
        const items = JSON.parse(saved) as RecentlyViewedItem[];
        // Sort by most recently viewed
        return items.sort((a, b) => b.viewedAt - a.viewedAt);
    } catch {
        return [];
    }
}

// Add item to recently viewed
export function addToRecentlyViewed(product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    images?: string[];
    image?: string;
    category: string;
}) {
    if (typeof window === "undefined") return;

    const items = getRecentlyViewed();

    // Remove if already exists
    const filtered = items.filter(item => item.id !== product.id);

    // Add to beginning
    const newItem: RecentlyViewedItem = {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        image: product.image || product.images?.[0] || "/placeholder.png",
        category: product.category,
        viewedAt: Date.now(),
    };

    filtered.unshift(newItem);

    // Keep only MAX_ITEMS
    const trimmed = filtered.slice(0, MAX_ITEMS);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

// Clear recently viewed
export function clearRecentlyViewed() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
}
