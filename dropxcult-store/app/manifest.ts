import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'DropXCult Store',
        short_name: 'DropXCult',
        description: 'Wear the Myth - Custom Streetwear & Mythology T-Shirts',
        start_url: '/',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#DC2626',
        icons: [
            {
                src: '/favicon.ico',
                sizes: '64x64 32x32 24x24 16x16',
                type: 'image/x-icon',
            },
            {
                src: '/logo.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/logo.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    };
}
