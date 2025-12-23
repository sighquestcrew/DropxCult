// Wishlist utility using localStorage

export interface WishlistItem {
    id: string;
    name: string;
    price: number;
    image: string;
    slug: string;
    sizes?: string[];
    category?: string; // e.g., "T-Shirt", "Hoodie", etc.
    garmentType?: string; // "T-Shirt" or "Hoodie"
}

const WISHLIST_KEY = "wishlist";

// Get all wishlist items
export function getWishlist(): WishlistItem[] {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem(WISHLIST_KEY);
    return saved ? JSON.parse(saved) : [];
}

// Save wishlist
export function saveWishlist(items: WishlistItem[]) {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
    // Dispatch custom event for syncing across tabs/components
    window.dispatchEvent(new CustomEvent("wishlist-updated"));
}

// Check if item is in wishlist
export function isInWishlist(id: string): boolean {
    const wishlist = getWishlist();
    return wishlist.some(item => item.id === id);
}

// Add item to wishlist
export function addToWishlist(item: WishlistItem): boolean {
    const wishlist = getWishlist();
    if (wishlist.some(i => i.id === item.id)) {
        return false; // Already in wishlist
    }
    wishlist.push(item);
    saveWishlist(wishlist);
    return true;
}

// Remove item from wishlist
export function removeFromWishlist(id: string): boolean {
    const wishlist = getWishlist();
    const filtered = wishlist.filter(item => item.id !== id);
    if (filtered.length === wishlist.length) {
        return false; // Item not found
    }
    saveWishlist(filtered);
    return true;
}

// Toggle wishlist item
export function toggleWishlist(item: WishlistItem): boolean {
    if (isInWishlist(item.id)) {
        removeFromWishlist(item.id);
        return false; // Removed
    } else {
        addToWishlist(item);
        return true; // Added
    }
}

// Clear wishlist
export function clearWishlist() {
    saveWishlist([]);
}

// Get wishlist count
export function getWishlistCount(): number {
    return getWishlist().length;
}
