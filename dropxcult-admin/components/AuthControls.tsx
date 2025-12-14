"use client";

import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import { logout } from "@/redux/slices/authSlice";
import Link from "next/link";
import { LogIn, LogOut, User, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

export default function AuthControls() {
    const dispatch = useDispatch();
    const router = useRouter();
    const { userInfo } = useSelector((state: RootState) => state.auth);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        dispatch(logout());
        router.push("/login");
        setIsOpen(false);
    };

    if (!userInfo) {
        return (
            <Link
                href="/login"
                className="flex items-center gap-2 text-gray-400 hover:text-white hover:bg-red-600 px-3 py-2 rounded transition text-sm"
            >
                <LogIn size={16} />
                <span className="hidden md:inline">Login</span>
            </Link>
        );
    }

    // Desktop: Full profile display
    // Mobile: Compact avatar with dropdown
    return (
        <>
            {/* Desktop Version */}
            <div className="hidden md:block space-y-2">
                <div className="flex items-center gap-3 p-2 text-gray-400">
                    <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center">
                        <User size={16} />
                    </div>
                    <div className="flex-1 truncate">
                        <div className="text-white text-sm font-medium truncate">{userInfo.name}</div>
                        <div className="text-xs text-gray-500 truncate">{userInfo.email}</div>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-red-600 p-2 rounded transition w-full"
                >
                    <LogOut size={20} />
                    Logout
                </button>
            </div>

            {/* Mobile Version - Compact dropdown */}
            <div className="md:hidden relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-2 py-1.5 rounded-lg transition"
                >
                    <div className="h-7 w-7 rounded-full bg-red-600/20 border border-red-600/50 flex items-center justify-center">
                        <User size={14} className="text-red-500" />
                    </div>
                    <span className="text-white text-sm font-medium max-w-[80px] truncate">
                        {userInfo.name?.split(' ')[0]}
                    </span>
                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown menu */}
                {isOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden">
                        {/* User info */}
                        <div className="p-3 border-b border-zinc-700">
                            <p className="text-white text-sm font-medium truncate">{userInfo.name}</p>
                            <p className="text-xs text-gray-500 truncate">{userInfo.email}</p>
                        </div>
                        {/* Logout button */}
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 w-full px-3 py-2.5 text-red-400 hover:bg-red-600/20 transition text-sm"
                        >
                            <LogOut size={16} />
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
