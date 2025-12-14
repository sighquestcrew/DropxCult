"use client";

import Image from "next/image";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { removeFromCart } from "@/redux/slices/cartSlice";
import { Trash2, ArrowRight } from "lucide-react";

export default function CartPage() {
  const dispatch = useDispatch();
  const { items, totalPrice } = useSelector((state: RootState) => state.cart);

  const handleRemove = (id: string, size: string) => {
    dispatch(removeFromCart({ id, size }));
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-black text-white space-y-4">
        <h2 className="text-2xl font-bold">Your Cart is Empty</h2>
        <p className="text-gray-400">The void stares back.</p>
        <Link
          href="/"
          className="px-6 py-3 bg-red-600 text-white font-bold hover:bg-red-700 transition"
        >
          RETURN TO SHOP
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-20">
      <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-6">
          <h1 className="text-3xl font-bold mb-8">
            SHOPPING CART ({items.length})
          </h1>

          {items.map((item) => (
            <div
              key={`${item.id}-${item.size}`}
              className="flex gap-4 p-4 bg-zinc-900 border border-zinc-800 items-center"
            >
              {/* Product Image */}
              <div className="relative h-24 w-24 flex-shrink-0 bg-zinc-800">
                {item.image && item.image !== "" ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    unoptimized // Fixes the SVG error
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-600 text-xs">
                    No Image
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1">
                <Link
                  href={`/product/${item.slug}`}
                  className="text-lg font-bold hover:text-red-500 transition"
                >
                  {item.name}
                </Link>
                <p className="text-gray-400 text-sm">
                  Size:{" "}
                  <span className="text-white font-bold">{item.size}</span>
                </p>
                <p className="text-gray-400 text-sm">
                  Qty: <span className="text-white font-bold">{item.qty}</span>
                </p>
              </div>

              {/* Price & Remove */}
              <div className="text-right space-y-2">
                <p className="font-bold text-red-500">
                  ₹{item.price * item.qty}
                </p>
                <button
                  onClick={() => handleRemove(item.id, item.size)}
                  className="text-gray-500 hover:text-white transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Checkout Summary */}
        <div className="lg:col-span-1">
          <div className="bg-zinc-900 border border-zinc-800 p-6 sticky top-24">
            <h2 className="text-xl font-bold mb-6">ORDER SUMMARY</h2>

            <div className="space-y-4 mb-6 border-b border-zinc-700 pb-6">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span className="text-white">₹{totalPrice}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Shipping</span>
                <span className="text-green-500">FREE</span>
              </div>
            </div>

            <div className="flex justify-between text-xl font-bold mb-8">
              <span>Total</span>
              <span>₹{totalPrice}</span>
            </div>

            <Link href="/checkout">
              <button className="w-full h-14 bg-white text-black font-bold uppercase tracking-widest hover:bg-red-600 hover:text-white transition-colors flex items-center justify-center gap-2">
                Proceed to Checkout
                <ArrowRight size={20} />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
