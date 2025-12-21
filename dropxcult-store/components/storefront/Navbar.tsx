"use client";

import Link from "next/link";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import { logout } from "@/redux/slices/authSlice";
import { ShoppingBag, User, LogOut, PenTool, Flame, UserCircle, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

import { setHasAppNavigation } from "@/redux/slices/uiSlice";

export default function Navbar() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { items } = useSelector((state: RootState) => state.cart);
  const { userInfo } = useSelector((state: RootState) => state.auth);

  const [isMounted, setIsMounted] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const pathname = usePathname();

  useEffect(() => {
    setIsMounted(true);
    if (pathname !== "/") {
      dispatch(setHasAppNavigation(true));
    }
  }, [pathname, dispatch]);

  const cartCount = items.reduce((acc, item) => acc + item.qty, 0);

  const handleLogout = () => {
    dispatch(logout());
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
    router.push("/");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-800 bg-black/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-gray-300 hover:text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold tracking-tighter text-white">
            DROP<span className="text-red-600">X</span>CULT
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center space-x-6 text-sm font-medium text-gray-300">
          <Link href="/" className="hover:text-red-500 transition-colors">
            Home
          </Link>

          <Link href="/shop" className="hover:text-red-500 transition-colors">
            Designs
          </Link>

          <Link href="/customize" className="flex items-center gap-1 hover:text-red-500 transition-colors">
            Customize
          </Link>

          <Link href="/community" className="flex items-center gap-1 hover:text-red-500 transition-colors">
            Community
          </Link>

          <Link href="/about" className="hover:text-red-500 transition-colors">
            About Us
          </Link>
        </div>

        {/* Right Side Icons */}
        <div className="flex items-center space-x-4 md:space-x-6">

          {/* User Auth Section with Dropdown */}
          {isMounted && userInfo ? (
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 hover:text-white text-gray-300 transition focus:outline-none"
                aria-label="Open user menu"
              >
                <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-700">
                  {userInfo.image ? (
                    <img src={userInfo.image} alt={userInfo.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-bold text-sm">{userInfo.name.charAt(0)}</span>
                  )}
                </div>
                <span className="hidden md:block text-sm font-bold">
                  Hi, {userInfo.name.split(" ")[0]}
                </span>
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-md shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-2">
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <UserCircle size={16} /> My Profile
                  </Link>
                  {userInfo.isAdmin && (
                    <Link
                      href="/admin/dashboard"
                      className="block px-4 py-2 text-sm text-red-400 hover:bg-zinc-800 hover:text-red-300 flex items-center gap-2 md:hidden"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <UserCircle size={16} /> Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-zinc-800 hover:text-red-500 flex items-center gap-2 border-t border-zinc-800"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}

              {/* Overlay to close dropdown when clicking outside */}
              {isProfileOpen && (
                <div
                  className="fixed inset-0 z-40 bg-transparent"
                  onClick={() => setIsProfileOpen(false)}
                ></div>
              )}
            </div>
          ) : (
            isMounted && (
              <Link href="/login" className="text-gray-300 hover:text-white" aria-label="Login">
                <User className="h-6 w-6" />
              </Link>
            )
          )}

          {/* Cart Icon */}
          <Link href="/cart" className="relative group" aria-label="View shopping cart">
            <ShoppingBag className="h-6 w-6 text-gray-300 group-hover:text-white transition-colors" />
            {isMounted && cartCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-black border-b border-zinc-800 pt-20 px-4 pb-4 flex flex-col space-y-4 animate-in slide-in-from-top-5 z-[60]">
          <Link href="/" className="text-white hover:text-gray-300 py-2 border-b border-zinc-900 font-medium" onClick={() => setIsMobileMenuOpen(false)}>
            Home
          </Link>
          <Link href="/shop" className="text-gray-300 hover:text-white py-2 border-b border-zinc-900" onClick={() => setIsMobileMenuOpen(false)}>
            Designs
          </Link>
          <Link href="/customize" className="text-gray-300 hover:text-white py-2 border-b border-zinc-900" onClick={() => setIsMobileMenuOpen(false)}>
            Customize
          </Link>
          <Link href="/community" className="text-gray-300 hover:text-white py-2 border-b border-zinc-900" onClick={() => setIsMobileMenuOpen(false)}>
            Community
          </Link>
          <Link href="/about" className="text-gray-300 hover:text-white py-2 border-b border-zinc-900" onClick={() => setIsMobileMenuOpen(false)}>
            About Us
          </Link>
        </div>
      )}
    </nav>
  );
}