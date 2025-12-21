import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/storefront/Navbar";
import Footer from "@/components/storefront/Footer"; // <--- This was likely missing or unused

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'),
  title: {
    default: "DropXCult | Wear the Myth - Custom Streetwear & Mythology T-Shirts",
    template: "%s | DropXCult"
  },
  description: "Premium streetwear inspired by Ancient Mythology and Auspicious Beasts. Design your own custom t-shirts or shop community creations. Free shipping on orders over ₹999.",
  keywords: ["custom oversized t-shirts", "streetwear india", "mythology clothing", "heavyweight cotton t-shirts", "custom 3d t-shirt design", "dropxcult", "puff print t-shirts", "graphic tees india", "anime streetwear", "urban clothing"],
  authors: [{ name: "DropXCult" }],
  creator: "DropXCult",
  publisher: "DropXCult",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: "DropXCult",
    title: "DropXCult | Wear the Myth - Custom Streetwear",
    description: "Premium streetwear inspired by Ancient Mythology. Design custom t-shirts with our 3D editor or shop community creations.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DropXCult - Custom Mythology Streetwear",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DropXCult | Wear the Myth",
    description: "Premium custom streetwear inspired by Ancient Mythology",
    images: ["/og-image.png"],
    creator: "@dropxcult",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-black text-white antialiased overflow-x-hidden`}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            {/* The Navbar sits at the top of every page */}
            <Navbar />

            {/* The main content (Home, Shop, Cart) renders here */}
            <main className="flex-1">
              {children}
            </main>

            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}