/**
 * Cloudinary Image Optimization Utility
 * Adds auto-format (WebP) and auto-quality transformations to reduce bandwidth
 */

/**
 * Transform a Cloudinary URL to add optimizations
 * Adds: f_auto (auto-format), q_auto (auto-quality), w_X (width)
 * 
 * @param url - Original Cloudinary URL
 * @param options - Transformation options
 * @returns Optimized Cloudinary URL
 */
export function optimizeCloudinaryImage(
    url: string | null | undefined,
    options: {
        width?: number;
        height?: number;
        quality?: 'auto' | 'auto:low' | 'auto:eco' | 'auto:good' | 'auto:best';
        format?: 'auto' | 'webp' | 'avif';
        crop?: 'fill' | 'fit' | 'scale' | 'thumb';
    } = {}
): string {
    if (!url) return '';

    // Only transform Cloudinary URLs
    if (!url.includes('cloudinary.com')) {
        return url;
    }

    const {
        width,
        height,
        quality = 'auto',
        format = 'auto',
        crop = 'fill'
    } = options;

    // Build transformation string
    const transforms: string[] = [];

    // Auto format (WebP/AVIF for modern browsers)
    transforms.push(`f_${format}`);

    // Auto quality (reduces file size)
    transforms.push(`q_${quality}`);

    // Size transformations
    if (width) transforms.push(`w_${width}`);
    if (height) transforms.push(`h_${height}`);
    if (width || height) transforms.push(`c_${crop}`);

    const transformString = transforms.join(',');

    // Insert transformations into URL
    // Cloudinary URL format: .../upload/[transformations]/[public_id]
    return url.replace('/upload/', `/upload/${transformString}/`);
}

/**
 * Get optimized image URL for product cards (smaller thumbnails)
 */
export function getProductThumbnail(url: string | null | undefined): string {
    return optimizeCloudinaryImage(url, {
        width: 400,
        height: 500,
        quality: 'auto:eco', // Lower quality for thumbnails
        crop: 'fill'
    });
}

/**
 * Get optimized image URL for product page (full size)
 */
export function getProductImage(url: string | null | undefined): string {
    return optimizeCloudinaryImage(url, {
        width: 800,
        quality: 'auto:good',
        crop: 'fit'
    });
}

/**
 * Get optimized image URL for review photos
 */
export function getReviewImage(url: string | null | undefined): string {
    return optimizeCloudinaryImage(url, {
        width: 200,
        height: 200,
        quality: 'auto:eco',
        crop: 'fill'
    });
}
