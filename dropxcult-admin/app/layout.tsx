import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Link from "next/link";
import { LayoutDashboard, ShoppingBag, Users, Package, Palette, Box, MessageCircle } from "lucide-react";
import SearchBarWrapper from "@/components/SearchBarWrapper";
import AuthControlsWrapper from "@/components/AuthControlsWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DropXCult Admin | Cult Control",
  description: "Admin panel for DropXCult store management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-black text-white antialiased`} suppressHydrationWarning>
        <Providers>
          <div className="flex min-h-screen">
            {/* Sidebar */}
            <aside className="w-64 border-r border-zinc-800 p-6 hidden md:block">
              <h2 className="text-2xl font-bold mb-8 text-red-600 tracking-tighter">CULT CONTROL</h2>

              <nav className="space-y-4">
                <Link href="/" className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-zinc-900 p-2 rounded transition">
                  <LayoutDashboard size={20} />
                  Dashboard
                </Link>
                <Link href="/products" className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-zinc-900 p-2 rounded transition">
                  <ShoppingBag size={20} />
                  Products
                </Link>
                <Link href="/orders" className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-zinc-900 p-2 rounded transition">
                  <Package size={20} />
                  Orders
                </Link>
                <Link href="/users" className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-zinc-900 p-2 rounded transition">
                  <Users size={20} />
                  Users
                </Link>
                <Link href="/custom-requests" className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-zinc-900 p-2 rounded transition">
                  <Palette size={20} />
                  Custom Requests
                </Link>
                <Link href="/3d-designs" className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-zinc-900 p-2 rounded transition">
                  <Box size={20} />
                  3D Designs
                </Link>
                <Link href="/inquiries" className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-zinc-900 p-2 rounded transition">
                  <MessageCircle size={20} />
                  Inquiries
                </Link>
              </nav>

              {/* Auth Controls */}
              <div className="mt-8 pt-4 border-t border-zinc-800">
                <AuthControlsWrapper />
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 bg-black overflow-x-hidden">
              {/* Header with Search */}
              <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4">
                <div className="hidden md:block flex-1">
                  <SearchBarWrapper />
                </div>
              </div>
              {/* Mobile Nav */}
              <div className="md:hidden mb-4 pb-3 border-b border-zinc-800">
                {/* User Info + Nav Row */}
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-red-600 tracking-tighter">CULT CONTROL</h2>
                  <AuthControlsWrapper />
                </div>
                <nav className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  <Link href="/" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-zinc-900 px-3 py-2 rounded whitespace-nowrap flex-shrink-0">
                    <LayoutDashboard size={14} /> Dashboard
                  </Link>
                  <Link href="/products" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-zinc-900 px-3 py-2 rounded whitespace-nowrap flex-shrink-0">
                    <ShoppingBag size={14} /> Products
                  </Link>
                  <Link href="/orders" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-zinc-900 px-3 py-2 rounded whitespace-nowrap flex-shrink-0">
                    <Package size={14} /> Orders
                  </Link>
                  <Link href="/users" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-zinc-900 px-3 py-2 rounded whitespace-nowrap flex-shrink-0">
                    <Users size={14} /> Users
                  </Link>
                  <Link href="/custom-requests" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-zinc-900 px-3 py-2 rounded whitespace-nowrap flex-shrink-0">
                    <Palette size={14} /> Requests
                  </Link>
                  <Link href="/3d-designs" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-zinc-900 px-3 py-2 rounded whitespace-nowrap flex-shrink-0">
                    <Box size={14} /> 3D
                  </Link>
                  <Link href="/inquiries" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-zinc-900 px-3 py-2 rounded whitespace-nowrap flex-shrink-0">
                    <MessageCircle size={14} /> Inquiries
                  </Link>
                </nav>
              </div>
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
