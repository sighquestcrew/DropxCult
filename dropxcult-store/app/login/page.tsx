"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useDispatch } from "react-redux";
import { setCredentials } from "@/redux/slices/authSlice";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const res = await axios.post("/api/auth/login", data);

      // Save to Redux and LocalStorage
      dispatch(setCredentials(res.data));

      toast.success("Welcome back.");
      router.push("/community");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Invalid email or password");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-black text-white px-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8 rounded-lg shadow-2xl">
        <h1 className="text-3xl font-bold text-center mb-2 tracking-tighter">ENTER THE CULT</h1>
        <p className="text-gray-400 text-center mb-8 text-sm">Login to manage your orders.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Email</label>
            <input
              {...register("email")}
              type="email"
              className="w-full bg-black border border-zinc-700 p-3 text-white focus:border-red-600 outline-none transition"
              placeholder="name@example.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Password</label>
            <input
              {...register("password")}
              type="password"
              className="w-full bg-black border border-zinc-700 p-3 text-white focus:border-red-600 outline-none transition"
              placeholder="••••••"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-12 mt-4 uppercase tracking-widest transition-colors flex items-center justify-center"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          New to the cult? <Link href="/register" className="text-white underline hover:text-red-500">Join here</Link>
        </div>
      </div>
    </div>
  );
}