"use client";

import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, ShieldCheck, Truck, CreditCard, Wallet, Tag, X, Check } from "lucide-react";
import { clearCart } from "@/redux/slices/cartSlice";
import axios from "axios";
import { toast } from "sonner";

// Razorpay type declaration
declare global {
  interface Window {
    Razorpay: any;
  }
}

// Form Validation Schema
const shippingSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  postalCode: z.string().min(4, "Pin code is required"),
  country: z.string().min(2, "Country is required"),
});

type ShippingFormValues = z.infer<typeof shippingSchema>;

// Load Razorpay script dynamically
const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { items, totalPrice } = useSelector((state: RootState) => state.cart);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">("razorpay");
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number; message: string } | null>(null);

  // Load Razorpay script on mount
  useEffect(() => {
    loadRazorpayScript().then((loaded) => {
      setScriptLoaded(loaded);
      if (!loaded) {
        toast.error("Failed to load payment gateway. Please refresh.");
      }
    });
  }, []);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      router.push("/");
    }
  }, [items, router]);

  if (items.length === 0) return null;

  // Setup Form
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

  // Calculate final price
  const discountAmount = appliedCoupon?.discountAmount || 0;
  const finalPrice = Math.max(0, totalPrice - discountAmount);

  // Apply coupon
  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const { data } = await axios.post("/api/coupons/validate", {
        code: couponCode,
        orderTotal: totalPrice
      });
      setAppliedCoupon({
        code: data.code,
        discountAmount: data.discountAmount,
        message: data.message
      });
      toast.success(data.message);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Invalid coupon");
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  // Handle Payment
  const onSubmit = async (data: ShippingFormValues) => {
    setIsProcessing(true);

    try {
      // 1. Create order on backend
      const orderResponse = await axios.post("/api/orders", {
        items: items.map((item) => ({
          _id: item.id,
          name: item.name,
          qty: item.qty,
          price: item.price,
          size: item.size,
          image: item.image,
          isCustom: item.isCustom || false,
          designId: item.designId,
        })),
        shippingAddress: data,
        paymentMethod: paymentMethod,
        couponCode: appliedCoupon?.code || null,
        discountAmount: discountAmount,
      });

      const { orderId, razorpayOrderId, amount, currency, error } = orderResponse.data;

      // Handle COD orders
      if (paymentMethod === "cod") {
        dispatch(clearCart());
        toast.success("Order placed successfully! Pay on delivery.");
        router.push(`/order-success?orderId=${orderId}&cod=true`);
        return;
      }

      // Check if payment gateway is not configured (demo mode)
      if (error && error.includes("Payment gateway not configured")) {
        toast.info("Demo Mode: Payment gateway not configured yet");
        setIsProcessing(false);
        return;
      }

      // Check if Razorpay key is available
      if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
        // DEMO MODE - Show popup instead of real payment
        toast.success(
          <div className="space-y-2">
            <p className="font-bold">🎉 Demo Order Created!</p>
            <p className="text-sm">Order ID: {orderId || "DEMO-" + Date.now()}</p>
            <p className="text-sm">Amount: ₹{finalPrice}</p>
            <p className="text-xs text-gray-400 mt-2">
              Note: Razorpay keys not configured. Add keys to enable real payments.
            </p>
          </div>,
          { duration: 8000 }
        );
        dispatch(clearCart());
        router.push(`/order-success?orderId=${orderId || "demo"}&demo=true`);
        return;
      }

      // Real Razorpay flow (when keys are configured)
      if (!scriptLoaded) {
        toast.error("Payment gateway not loaded. Please refresh the page.");
        setIsProcessing(false);
        return;
      }

      // 2. Configure Razorpay options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: amount * 100, // Amount in paise
        currency: currency,
        name: "DropX Cult",
        description: "Premium Streetwear Purchase",
        image: "/logo.png", // Your logo
        order_id: razorpayOrderId,
        handler: async function (response: any) {
          // 3. Verify payment on backend
          try {
            const verifyResponse = await axios.post("/api/payments/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: orderId,
            });

            if (verifyResponse.data.success) {
              // Clear cart and redirect to success
              dispatch(clearCart());
              toast.success("Payment successful!");
              router.push(`/order-success?orderId=${orderId}`);
            } else {
              toast.error("Payment verification failed");
              router.push(`/order-failed?orderId=${orderId}`);
            }
          } catch (error) {
            console.error("Verification error:", error);
            toast.error("Payment verification failed");
            router.push(`/order-failed?orderId=${orderId}`);
          }
        },
        prefill: {
          name: data.fullName,
          email: data.email,
          contact: data.phone,
        },
        notes: {
          address: `${data.address}, ${data.city}, ${data.state} - ${data.postalCode}`,
        },
        theme: {
          color: "#DC2626", // Red theme matching DropX Cult
          backdrop_color: "#000000",
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            toast.info("Payment cancelled");
          },
        },
      };

      // 4. Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", function (response: any) {
        console.error("Payment failed:", response.error);
        toast.error(`Payment failed: ${response.error.description}`);
        setIsProcessing(false);
        router.push(`/order-failed?reason=${response.error.code}`);
      });
      razorpay.open();

    } catch (error: any) {
      console.error("Order creation error:", error);

      // Check for demo mode error
      const errorMsg = error.response?.data?.error || "";
      if (errorMsg.includes("Payment gateway not configured")) {
        toast.info(
          <div className="space-y-2">
            <p className="font-bold">⚙️ Demo Mode Active</p>
            <p className="text-sm">Payment gateway not configured.</p>
            <p className="text-xs text-gray-400">Add Razorpay keys to .env.local to enable payments.</p>
          </div>,
          { duration: 5000 }
        );
      } else {
        toast.error(errorMsg || "Failed to create order");
      }
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white py-10 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black tracking-tight">CHECKOUT</h1>
          <p className="text-gray-400 mt-2">Complete your order securely</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* LEFT: Shipping Form (3 cols) */}
          <div className="lg:col-span-3">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                <Truck className="text-red-500" size={24} />
                SHIPPING DETAILS
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Full Name */}
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Full Name *</label>
                  <input
                    {...register("fullName")}
                    className="w-full bg-zinc-800 border border-zinc-700 p-3 rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition"
                    placeholder="John Doe"
                  />
                  {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Email *</label>
                    <input
                      {...register("email")}
                      type="email"
                      className="w-full bg-zinc-800 border border-zinc-700 p-3 rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition"
                      placeholder="john@example.com"
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Phone *</label>
                    <input
                      {...register("phone")}
                      type="tel"
                      className="w-full bg-zinc-800 border border-zinc-700 p-3 rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition"
                      placeholder="+91 98765 43210"
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Address *</label>
                  <input
                    {...register("address")}
                    className="w-full bg-zinc-800 border border-zinc-700 p-3 rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition"
                    placeholder="123 Street Name, Apartment/Suite"
                  />
                  {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
                </div>

                {/* City & State */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">City *</label>
                    <input
                      {...register("city")}
                      className="w-full bg-zinc-800 border border-zinc-700 p-3 rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition"
                      placeholder="Mumbai"
                    />
                    {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">State *</label>
                    <input
                      {...register("state")}
                      className="w-full bg-zinc-800 border border-zinc-700 p-3 rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition"
                      placeholder="Maharashtra"
                    />
                    {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state.message}</p>}
                  </div>
                </div>

                {/* Pin Code & Country */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Pin Code *</label>
                    <input
                      {...register("postalCode")}
                      className="w-full bg-zinc-800 border border-zinc-700 p-3 rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition"
                      placeholder="400001"
                    />
                    {errors.postalCode && <p className="text-red-500 text-xs mt-1">{errors.postalCode.message}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Country</label>
                    <input
                      {...register("country")}
                      className="w-full bg-zinc-800 border border-zinc-700 p-3 rounded-lg text-gray-400"
                      readOnly
                    />
                  </div>
                </div>

                {/* Payment Method Selection */}
                <div className="pt-4 border-t border-zinc-800">
                  <h3 className="text-sm font-bold text-gray-400 mb-3">PAYMENT METHOD</h3>
                  <div className="space-y-3">
                    <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'razorpay' ? 'border-red-500 bg-red-500/10' : 'border-zinc-700 hover:border-zinc-600'
                      }`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="razorpay"
                        checked={paymentMethod === 'razorpay'}
                        onChange={() => setPaymentMethod('razorpay')}
                        className="accent-red-500"
                      />
                      <CreditCard size={20} className="text-gray-400" />
                      <div>
                        <p className="font-medium">Pay Online</p>
                        <p className="text-xs text-gray-500">Cards, UPI, Net Banking</p>
                      </div>
                    </label>
                    <div className="relative opacity-50 cursor-not-allowed">
                      <div className="flex items-center gap-3 p-3 border border-zinc-700 rounded-lg">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cod"
                          disabled
                          className="accent-red-500"
                        />
                        <Wallet size={20} className="text-gray-500" />
                        <div>
                          <p className="font-medium text-gray-400">Cash on Delivery</p>
                          <p className="text-xs text-gray-600">Pay when you receive</p>
                        </div>
                      </div>
                      <span className="absolute top-1/2 right-3 -translate-y-1/2 text-xs bg-yellow-600/30 text-yellow-400 px-2 py-1 rounded font-bold">
                        COMING SOON
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isProcessing || (paymentMethod === 'razorpay' && !scriptLoaded)}
                  className="w-full bg-red-600 text-white font-bold h-14 mt-6 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Processing...
                    </>
                  ) : paymentMethod === 'cod' ? (
                    <>
                      <Wallet size={20} />
                      PLACE ORDER (₹{finalPrice})
                    </>
                  ) : (
                    <>
                      <CreditCard size={20} />
                      PAY ₹{finalPrice}
                    </>
                  )}
                </button>

                {/* Security Badge */}
                <div className="flex items-center justify-center gap-2 text-gray-500 text-sm mt-4">
                  <ShieldCheck size={16} />
                  <span>{paymentMethod === 'cod' ? 'Secure Checkout' : 'Secured by Razorpay'}</span>
                </div>
              </form>
            </div>
          </div>

          {/* RIGHT: Order Summary (2 cols) */}
          <div className="lg:col-span-2">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 sticky top-4">
              <h3 className="text-xl font-bold mb-4">ORDER SUMMARY</h3>

              {/* Items */}
              <div className="space-y-4 max-h-[350px] overflow-y-auto mb-6 pr-2">
                {items.map((item) => (
                  <div
                    key={`${item.id}-${item.size}`}
                    className="flex gap-4 border-b border-zinc-800 pb-4"
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg bg-zinc-800"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-xs text-gray-400">
                        Size: {item.size} | Qty: {item.qty}
                      </p>
                      {item.isCustom && (
                        <span className="text-xs text-red-500">Custom Design</span>
                      )}
                    </div>
                    <p className="font-semibold">₹{item.price * item.qty}</p>
                  </div>
                ))}
              </div>

              {/* Coupon Code */}
              <div className="mb-4 pb-4 border-b border-zinc-700">
                <label className="text-sm text-gray-400 mb-2 block">Coupon Code</label>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-green-500" />
                      <span className="font-mono font-bold text-green-400">{appliedCoupon.code}</span>
                      <span className="text-sm text-gray-400">(-₹{appliedCoupon.discountAmount})</span>
                    </div>
                    <button onClick={removeCoupon} className="text-gray-400 hover:text-white">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter code"
                      className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={applyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      {couponLoading ? <Loader2 size={16} className="animate-spin" /> : 'Apply'}
                    </button>
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="space-y-2 border-t border-zinc-700 pt-4">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span>₹{totalPrice}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-green-400">
                    <span>Discount</span>
                    <span>-₹{appliedCoupon.discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-400">
                  <span>Shipping</span>
                  <span className="text-green-500">FREE</span>
                </div>
                <div className="flex justify-between text-xl font-bold pt-2 border-t border-zinc-700">
                  <span>TOTAL</span>
                  <span className="text-red-500">₹{finalPrice}</span>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="mt-6 pt-4 border-t border-zinc-800">
                <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-green-500" />
                    <span>Secure Payment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck size={14} className="text-blue-500" />
                    <span>Free Shipping</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}