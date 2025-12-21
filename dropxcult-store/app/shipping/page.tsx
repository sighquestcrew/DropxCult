"use client";

import { Truck, RotateCcw, Clock, MapPin, CreditCard, Package, HelpCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ShippingPage() {
    return (
        <div className="min-h-screen bg-black text-white py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Back Link */}
                <Link href="/" className="flex items-center text-gray-400 hover:text-white mb-8 transition-colors">
                    <ArrowLeft size={18} className="mr-2" />
                    Back to Home
                </Link>

                {/* Page Header */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Shipping & Returns</h1>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Everything you need to know about getting your mythical gear delivered and our hassle-free return policy.
                    </p>
                </div>

                {/* Shipping Section */}
                <section className="mb-16">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-green-600/20 rounded-full flex items-center justify-center">
                            <Truck className="text-green-500" size={24} />
                        </div>
                        <h2 className="text-2xl font-bold">Shipping Information</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Standard Shipping */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Clock size={20} className="text-gray-400" />
                                <h3 className="font-semibold">Standard Delivery</h3>
                            </div>
                            <ul className="space-y-3 text-sm text-gray-400">
                                <li className="flex justify-between">
                                    <span>Delivery Time</span>
                                    <span className="text-white">5-7 Business Days</span>
                                </li>
                                <li className="flex justify-between">
                                    <span>Cost</span>
                                    <span className="text-white">₹49</span>
                                </li>
                                <li className="flex justify-between">
                                    <span>Free Shipping Above</span>
                                    <span className="text-green-500 font-semibold">₹999</span>
                                </li>
                            </ul>
                        </div>

                        {/* Express Shipping */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Package size={20} className="text-gray-400" />
                                <h3 className="font-semibold">Express Delivery</h3>
                            </div>
                            <ul className="space-y-3 text-sm text-gray-400">
                                <li className="flex justify-between">
                                    <span>Delivery Time</span>
                                    <span className="text-white">2-3 Business Days</span>
                                </li>
                                <li className="flex justify-between">
                                    <span>Cost</span>
                                    <span className="text-white">₹99</span>
                                </li>
                                <li className="flex justify-between">
                                    <span>Available</span>
                                    <span className="text-white">Metro Cities</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Additional Shipping Info */}
                    <div className="mt-8 bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <MapPin size={18} className="text-red-500" />
                            Shipping Coverage
                        </h3>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li>• We ship Pan-India to all serviceable pin codes</li>
                            <li>• Orders are dispatched within 24-48 hours (excluding weekends)</li>
                            <li>• You will receive tracking details via SMS and email once shipped</li>
                            <li>• Delivery timelines may vary during sales or festive seasons</li>
                        </ul>
                    </div>
                </section>

                {/* Returns Section */}
                <section className="mb-16">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center">
                            <RotateCcw className="text-blue-500" size={24} />
                        </div>
                        <h2 className="text-2xl font-bold">Returns & Exchanges</h2>
                    </div>

                    {/* Return Policy Cards */}
                    <div className="space-y-4">
                        {/* Admin Products */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                            <h3 className="font-semibold mb-4 text-green-500">Standard Products</h3>
                            <ul className="space-y-3 text-sm text-gray-400">
                                <li className="flex items-start gap-3">
                                    <span className="text-green-500">✓</span>
                                    <span>7-day hassle-free returns from the date of delivery</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-500">✓</span>
                                    <span>Product must be unworn, unwashed, and with original tags attached</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-500">✓</span>
                                    <span>Full refund will be processed within 5-7 business days after pickup</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-500">✓</span>
                                    <span>Size exchanges available (subject to stock availability)</span>
                                </li>
                            </ul>
                        </div>

                        {/* Custom Designs */}
                        <div className="bg-zinc-900 border border-red-900/50 rounded-lg p-6">
                            <h3 className="font-semibold mb-4 text-red-500">Custom 3D Designs</h3>
                            <ul className="space-y-3 text-sm text-gray-400">
                                <li className="flex items-start gap-3">
                                    <span className="text-red-500">✗</span>
                                    <span>Custom designs are made-to-order and <strong className="text-white">non-returnable</strong></span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-red-500">✗</span>
                                    <span>Please check the size chart carefully before ordering</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-yellow-500">!</span>
                                    <span>Damaged or defective items will be replaced free of cost</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Return Process */}
                    <div className="mt-8 bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
                        <h3 className="font-semibold mb-4">How to Return</h3>
                        <ol className="space-y-4 text-sm text-gray-400">
                            <li className="flex items-start gap-3">
                                <span className="bg-white text-black w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
                                <span>Contact us at <a href="mailto:returns@dropxcult.com" className="text-red-500 hover:underline">returns@dropxcult.com</a> with your order ID</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="bg-white text-black w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
                                <span>We will arrange a pickup from your address within 2-3 days</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="bg-white text-black w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
                                <span>Once received and inspected, refund will be initiated</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="bg-white text-black w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">4</span>
                                <span>Refund reflects in your account within 5-7 business days</span>
                            </li>
                        </ol>
                    </div>
                </section>

                {/* Payment Methods */}
                <section className="mb-16">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center">
                            <CreditCard className="text-purple-500" size={24} />
                        </div>
                        <h2 className="text-2xl font-bold">Payment Methods</h2>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                        <ul className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <li className="bg-zinc-800 rounded-lg p-4 text-center">
                                <span className="text-white font-medium">Credit/Debit Cards</span>
                            </li>
                            <li className="bg-zinc-800 rounded-lg p-4 text-center">
                                <span className="text-white font-medium">UPI</span>
                            </li>
                            <li className="bg-zinc-800 rounded-lg p-4 text-center">
                                <span className="text-white font-medium">Net Banking</span>
                            </li>
                            <li className="bg-zinc-800 rounded-lg p-4 text-center">
                                <span className="text-white font-medium">Wallets</span>
                            </li>
                        </ul>
                        <p className="text-xs text-gray-500 mt-4 text-center">
                            All payments are secured by Razorpay. Cash on Delivery coming soon!
                        </p>
                    </div>
                </section>

                {/* Help Section */}
                <section className="text-center">
                    <div className="bg-gradient-to-r from-red-600/20 to-purple-600/20 border border-zinc-800 rounded-lg p-8">
                        <HelpCircle size={40} className="mx-auto mb-4 text-gray-400" />
                        <h2 className="text-xl font-bold mb-2">Still have questions?</h2>
                        <p className="text-gray-400 mb-6">Our support team is here to help you</p>
                        <Link href="/contact">
                            <button className="bg-white text-black px-8 py-3 rounded font-bold hover:bg-gray-200 transition-colors">
                                Contact Us
                            </button>
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}
