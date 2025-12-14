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
// We will create this auth slice next, for now just comment the dispatch out if it errors
// import { setCredentials } from "@/redux/slices/authSlice"; 

const registerSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  // const dispatch = useDispatch();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      const res = await axios.post("/api/auth/register", {
        name: data.name,
        email: data.email,
        password: data.password,
      });

      toast.success("Welcome to the Cult.");
      // dispatch(setCredentials(res.data)); // Save to Redux later
      
      // Store token in localStorage for now (Simple method)
      localStorage.setItem("userInfo", JSON.stringify(res.data));
      
      router.push("/");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Registration Failed");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-black text-white px-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8 rounded-lg shadow-2xl">
        <h1 className="text-3xl font-bold text-center mb-2 tracking-tighter">JOIN THE CULT</h1>
        <p className="text-gray-400 text-center mb-8 text-sm">Create an account to track your orders.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Name</label>
            <input 
              {...register("name")}
              className="w-full bg-black border border-zinc-700 p-3 text-white focus:border-red-600 outline-none transition"
              placeholder="Your Name"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          {/* Email */}
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

          {/* Password */}
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

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Confirm Password</label>
            <input 
              {...register("confirmPassword")}
              type="password"
              className="w-full bg-black border border-zinc-700 p-3 text-white focus:border-red-600 outline-none transition"
              placeholder="••••••"
            />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-12 mt-4 uppercase tracking-widest transition-colors flex items-center justify-center"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : "Sign Up"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          Already a member? <Link href="/login" className="text-white underline hover:text-red-500">Login here</Link>
        </div>
      </div>
    </div>
  );
}