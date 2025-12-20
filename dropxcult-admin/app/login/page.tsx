"use client";

import { useState } from "react";
import { useDispatch } from "react-redux";
import { setCredentials } from "@/redux/slices/authSlice";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

export default function AdminLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useDispatch();
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Use internal API for login
            const { data } = await axios.post(`/api/auth/login`, {
                email,
                password
            });

            if (!data.isAdmin) {
                toast.error("Only admins can access this panel");
                setIsLoading(false);
                return;
            }

            dispatch(setCredentials(data));
            toast.success("Welcome, Admin!");
            router.push("/");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Login failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black">
            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-lg w-full max-w-md">
                <div className="text-center mb-8">
                    <Lock className="w-12 h-12 mx-auto text-red-600 mb-4" />
                    <h1 className="text-2xl font-bold text-white">CULT CONTROL</h1>
                    <p className="text-gray-500 text-sm mt-2">Admin Access Only</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="text-sm text-gray-400 block mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black border border-zinc-700 rounded px-4 py-2 text-white focus:border-red-600 focus:outline-none"
                            placeholder="admin@dropxcult.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-400 block mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black border border-zinc-700 rounded px-4 py-2 text-white focus:border-red-600 focus:outline-none"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="animate-spin" size={18} />
                                Authenticating...
                            </>
                        ) : (
                            "Access Control Panel"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
