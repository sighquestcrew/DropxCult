"use client";

import { useState } from "react";
import { useDispatch } from "react-redux";
import { setCredentials } from "@/redux/slices/authSlice";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Loader2, Lock, Shield, KeyRound, Mail } from "lucide-react";
import { toast } from "sonner";

type LoginStep = "credentials" | "2fa";

export default function AdminLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState<LoginStep>("credentials");
    const [tempToken, setTempToken] = useState("");
    const dispatch = useDispatch();
    const router = useRouter();

    // Step 1: Verify credentials
    const handleCredentialSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Verify credentials first
            const { data } = await axios.post(`/api/auth/login`, {
                email,
                password
            });

            if (!data.isAdmin) {
                toast.error("Only admins can access this panel");
                setIsLoading(false);
                return;
            }

            // Generate temp token and send 2FA code
            const tempTok = crypto.randomUUID();
            setTempToken(tempTok);

            // Send 2FA code
            const { data: tfaData } = await axios.post(`/api/2fa/send`, {
                email,
                tempToken: tempTok
            });

            toast.success("Verification code sent to your email");


            setStep("2fa");
        } catch (error: any) {
            toast.error(error.response?.data?.message || error.response?.data?.error || "Login failed");
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2: Verify 2FA code
    const handleCodeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { data } = await axios.post(`/api/2fa/verify`, {
                email,
                code,
                tempToken
            });

            dispatch(setCredentials(data.user));
            toast.success("Welcome, Admin!");
            router.push("/");
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || "Verification failed";
            const remaining = error.response?.data?.attemptsRemaining;

            if (remaining !== undefined) {
                toast.error(`${errorMsg}. ${remaining} attempts remaining.`);
            } else {
                toast.error(errorMsg);
            }

            // If too many attempts or code expired, go back to credentials
            if (error.response?.status === 429 || errorMsg.includes("expired")) {
                setStep("credentials");
                setCode("");
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Resend code
    const handleResendCode = async () => {
        setIsLoading(true);
        try {
            const { data: tfaData } = await axios.post(`/api/2fa/send`, {
                email,
                tempToken
            });
            toast.success("New verification code sent");

            setCode("");
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to resend code");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black">
            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-xl w-full max-w-md shadow-2xl">
                <div className="text-center mb-8">
                    {step === "credentials" ? (
                        <Lock className="w-12 h-12 mx-auto text-red-600 mb-4" />
                    ) : (
                        <Shield className="w-12 h-12 mx-auto text-green-500 mb-4" />
                    )}
                    <h1 className="text-2xl font-bold text-white">CULT CONTROL</h1>
                    <p className="text-gray-500 text-sm mt-2">
                        {step === "credentials"
                            ? "Admin Access Only"
                            : "Two-Factor Authentication"}
                    </p>
                </div>

                {step === "credentials" ? (
                    // Step 1: Email & Password
                    <form onSubmit={handleCredentialSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm text-gray-400 block mb-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-black border border-zinc-700 rounded-lg pl-10 pr-4 py-3 text-white focus:border-red-600 focus:outline-none transition"
                                    placeholder="admin@dropxcult.com"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm text-gray-400 block mb-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-black border border-zinc-700 rounded-lg pl-10 pr-4 py-3 text-white focus:border-red-600 focus:outline-none transition"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    <KeyRound size={18} />
                                    Continue to 2FA
                                </>
                            )}
                        </button>
                    </form>
                ) : (
                    // Step 2: 2FA Code
                    <form onSubmit={handleCodeSubmit} className="space-y-4">
                        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 mb-4">
                            <p className="text-sm text-gray-400 text-center">
                                Enter the 6-digit code sent to<br />
                                <span className="text-white font-medium">{email}</span>
                            </p>
                        </div>

                        <div>
                            <label className="text-sm text-gray-400 block mb-1">Verification Code</label>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-4 text-white text-center text-2xl font-mono tracking-[0.5em] focus:border-green-500 focus:outline-none transition"
                                placeholder="000000"
                                maxLength={6}
                                required
                                autoFocus
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || code.length !== 6}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    <Shield size={18} />
                                    Verify & Login
                                </>
                            )}
                        </button>

                        <div className="flex items-center justify-between pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setStep("credentials");
                                    setCode("");
                                }}
                                className="text-sm text-gray-500 hover:text-white transition"
                            >
                                ← Back
                            </button>
                            <button
                                type="button"
                                onClick={handleResendCode}
                                disabled={isLoading}
                                className="text-sm text-red-500 hover:text-red-400 transition disabled:opacity-50"
                            >
                                Resend Code
                            </button>
                        </div>
                    </form>
                )}

                {/* Security notice */}
                <div className="mt-6 pt-4 border-t border-zinc-800">
                    <p className="text-xs text-gray-600 text-center">
                        🔒 Protected by two-factor authentication
                    </p>
                </div>
            </div>
        </div>
    );
}
