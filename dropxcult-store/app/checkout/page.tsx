"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";

// 1. Define the Form Validation Schema
const shippingSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  postalCode: z.string().min(4, "Zip Code is required"),
  country: z.string().min(2, "Country is required"),
});

type ShippingFormValues = z.infer<typeof shippingSchema>;

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice } = useSelector((state: RootState) => state.cart);
  const [isProcessing, setIsProcessing] = useState(false);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      router.push("/");
    }
  }, [items, router]);

  if (items.length === 0) return null;

  // 2. Setup Form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      country: "India",
    },
  });

  // 3. Handle Submit
  const onSubmit = async (data: ShippingFormValues) => {
    setIsProcessing(true);

    // Simulate API call for now (We will connect Razorpay in the next step)
    console.log("Shipping Data:", data);
    console.log("Cart Items:", items);

    setTimeout(() => {
      alert("Order Data Ready! Next Step: Payment Gateway.");
      setIsProcessing(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-black text-white py-10 px-4">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">

        {/* LEFT: Shipping Form */}
        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="bg-red-600 text-white w-8 h-8 flex items-center justify-center rounded-full text-sm">1</span>
            SHIPPING DETAILS
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-gray-400 text-sm mb-1">Full Name</label>
              <input
                {...register("fullName")}
                className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded focus:border-red-600 outline-none transition"
                placeholder="John Doe"
              />
              {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
            </div>

            {/* Address */}
            <div>
              <label className="block text-gray-400 text-sm mb-1">Address</label>
              <input
                {...register("address")}
                className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded focus:border-red-600 outline-none transition"
                placeholder="Flat 101, Dark Tower"
              />
              {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
            </div>

            {/* City & Zip */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">City</label>
                <input
                  {...register("city")}
                  className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded focus:border-red-600 outline-none transition"
                  placeholder="Mumbai"
                />
                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Pin Code</label>
                <input
                  {...register("postalCode")}
                  className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded focus:border-red-600 outline-none transition"
                  placeholder="400001"
                />
                {errors.postalCode && <p className="text-red-500 text-xs mt-1">{errors.postalCode.message}</p>}
              </div>
            </div>

            {/* Country */}
            <div>
              <label className="block text-gray-400 text-sm mb-1">Country</label>
              <input
                {...register("country")}
                className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded focus:border-red-600 outline-none transition"
                readOnly
              />
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full bg-white text-black font-bold h-12 mt-6 hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="animate-spin mx-auto" /> : "PROCEED TO PAYMENT"}
            </button>
          </form>
        </div>

        {/* RIGHT: Order Summary */}
        <div className="bg-zinc-900 p-6 h-fit border border-zinc-800 rounded">
          <h3 className="text-xl font-bold mb-4">IN YOUR BAG</h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto mb-6 pr-2">
            {items.map(item => (
              <div key={`${item.id}-${item.size}`} className="flex justify-between items-center border-b border-zinc-800 pb-2">
                <div>
                  <p className="font-bold">{item.name}</p>
                  <p className="text-xs text-gray-400">Size: {item.size} | x{item.qty}</p>
                </div>
                <p>₹{item.price * item.qty}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xl font-bold border-t border-zinc-700 pt-4">
            <span>TOTAL</span>
            <span>₹{totalPrice}</span>
          </div>
        </div>

      </div>
    </div>
  );
}