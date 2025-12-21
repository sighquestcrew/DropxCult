"use client";

import Link from "next/link";
import { Instagram, Twitter, Disc as Discord, Send } from "lucide-react";

const Footer = () => {
    return (
        <footer className="bg-black text-white pt-16 pb-8 border-t border-white/10">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    {/* Brand Column */}
                    <div className="space-y-4">
                        <h3 className="text-2xl font-bold tracking-tighter">DropXCult</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Wear the Myth. Streetwear inspired by Ancient Mythology and Auspicious Beasts.
                        </p>
                    </div>

                    {/* Shop Column */}
                    <div>
                        <h4 className="font-semibold mb-6">Shop</h4>
                        <ul className="space-y-4 text-sm text-gray-400">
                            <li>
                                <Link href="/shop" className="hover:text-white transition-colors">
                                    All Products
                                </Link>
                            </li>
                            <li>
                                <Link href="/shop?sort=newest" className="hover:text-white transition-colors">
                                    New Arrivals
                                </Link>
                            </li>
                            <li>
                                <Link href="/shop?sort=bestsellers" className="hover:text-white transition-colors">
                                    Best Sellers
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support Column */}
                    <div>
                        <h4 className="font-semibold mb-6">Support</h4>
                        <ul className="space-y-4 text-sm text-gray-400">
                            <li>
                                <Link href="/track-order" className="hover:text-white transition-colors">
                                    Track Order
                                </Link>
                            </li>
                            <li>
                                <Link href="/faq" className="hover:text-white transition-colors">
                                    FAQ
                                </Link>
                            </li>
                            <li>
                                <Link href="/shipping" className="hover:text-white transition-colors">
                                    Shipping & Returns
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="hover:text-white transition-colors">
                                    Contact Us
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter Column */}
                    <div>
                        <h4 className="font-semibold mb-6">Join the Cult</h4>
                        <div className="space-y-4">
                            <p className="text-sm text-gray-400">
                                Subscribe for exclusive drops and early access.
                            </p>
                            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="bg-white/5 border border-white/10 rounded px-4 py-2 text-sm flex-1 focus:outline-none focus:border-white/30 transition-colors"
                                />
                                <button
                                    type="submit"
                                    className="bg-white text-black px-4 py-2 rounded hover:bg-gray-200 transition-colors"
                                    aria-label="Subscribe to newsletter"
                                >
                                    <Send size={18} />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-gray-500">
                        © {new Date().getFullYear()} DropXCult. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        <a
                            href="https://www.instagram.com/dropxcult?igsh=bjE0ODU4cXVkNHg2"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-white transition-colors"
                            aria-label="Instagram"
                        >
                            <Instagram size={20} />
                        </a>
                        <a
                            href="#"
                            className="text-gray-400 hover:text-white transition-colors"
                            aria-label="Twitter"
                        >
                            <Twitter size={20} />
                        </a>
                        <a
                            href="#"
                            className="text-gray-400 hover:text-white transition-colors"
                            aria-label="Discord"
                        >
                            <Discord size={20} />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
