"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ArrowLeft, HelpCircle, Search, X } from "lucide-react";
import Link from "next/link";

const FAQ_DATA = [
    {
        category: "Orders & Shipping",
        questions: [
            {
                q: "How long does delivery take?",
                a: "Standard delivery takes 5-7 business days. Express delivery (available for metro cities) takes 2-3 business days. Orders are dispatched within 24-48 hours."
            },
            {
                q: "Is shipping free?",
                a: "Yes! Shipping is free on all orders above ₹999. For orders below ₹999, a flat shipping fee of ₹49 applies."
            },
            {
                q: "Can I track my order?",
                a: "Absolutely! Once your order is shipped, you'll receive an SMS and email with tracking details. You can also track from your Profile page."
            },
            {
                q: "Do you deliver internationally?",
                a: "Currently, we only ship within India. International shipping is coming soon!"
            }
        ]
    },
    {
        category: "Returns & Refunds",
        questions: [
            {
                q: "What is your return policy?",
                a: "We offer 7-day hassle-free returns for standard products. Items must be unworn, unwashed, and have original tags attached."
            },
            {
                q: "Can I return custom 3D designs?",
                a: "Custom 3D designs are made-to-order and cannot be returned. Please check the size chart carefully before ordering. However, damaged or defective items will be replaced."
            },
            {
                q: "How do I initiate a return?",
                a: "Email us at returns@dropxcult.com with your order ID. We'll arrange a pickup within 2-3 days. Refunds are processed within 5-7 business days after pickup."
            },
            {
                q: "Can I exchange for a different size?",
                a: "Yes! Size exchanges are available for standard products subject to stock availability. Contact us within 7 days of delivery."
            }
        ]
    },
    {
        category: "Products & Sizing",
        questions: [
            {
                q: "How do I find my size?",
                a: "Each product page has a Size Chart link. We provide measurements for Chest, Length, and Shoulder. When in doubt, size up for a relaxed fit."
            },
            {
                q: "What material are the t-shirts made of?",
                a: "Our t-shirts are made of premium 240 GSM 100% combed cotton for maximum comfort and durability. Custom designs may use DTG (Direct-to-Garment) printing."
            },
            {
                q: "What's the difference between regular and oversized fit?",
                a: "Regular fit follows standard body contours. Oversized fit is roomier with dropped shoulders and a longer length for that streetwear aesthetic."
            },
            {
                q: "Do colors fade after washing?",
                a: "We use high-quality dyes and printing techniques. Wash inside-out in cold water to maintain print quality and color vibrancy."
            }
        ]
    },
    {
        category: "Custom 3D Designs",
        questions: [
            {
                q: "What is the 3D Editor?",
                a: "Our 3D Editor lets you create custom t-shirt designs using a real-time 3D preview. Add images, text, and see your design on an actual t-shirt model."
            },
            {
                q: "How much do custom designs cost?",
                a: "All custom 3D designs are priced at a flat ₹999, regardless of the design complexity or t-shirt type."
            },
            {
                q: "What is the Royalty program?",
                a: "If your design is selected by our team, you can opt into the Royalty program. Your design goes public on our shop, and you earn royalties when others purchase it!"
            },
            {
                q: "Can I edit my design after saving?",
                a: "Yes! You can find all your saved designs in the Customize section. Edit, rename, or delete them anytime before placing an order."
            }
        ]
    },
    {
        category: "Payments & Security",
        questions: [
            {
                q: "What payment methods do you accept?",
                a: "We accept Credit/Debit Cards, UPI, Net Banking, and Wallets. All payments are secured by Razorpay."
            },
            {
                q: "Is my payment information secure?",
                a: "Yes! We use Razorpay's PCI-DSS compliant payment gateway. Your card details are never stored on our servers."
            },
            {
                q: "Do you offer Cash on Delivery?",
                a: "COD is coming soon! Currently, we only accept prepaid orders to minimize fraudulent orders."
            },
            {
                q: "Can I cancel my order?",
                a: "Orders can be cancelled within 2 hours of placing them. After that, the order goes into processing and cannot be cancelled."
            }
        ]
    }
];

export default function FAQPage() {
    const [openItems, setOpenItems] = useState<{ [key: string]: boolean }>({});
    const [searchQuery, setSearchQuery] = useState("");

    const toggleItem = (key: string) => {
        setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Filter FAQ data based on search query
    const filteredData = useMemo(() => {
        if (!searchQuery.trim()) return FAQ_DATA;

        const query = searchQuery.toLowerCase();
        return FAQ_DATA.map(section => ({
            ...section,
            questions: section.questions.filter(
                item =>
                    item.q.toLowerCase().includes(query) ||
                    item.a.toLowerCase().includes(query)
            )
        })).filter(section => section.questions.length > 0);
    }, [searchQuery]);

    // Auto-expand matching items when searching
    const effectiveOpenItems = useMemo(() => {
        if (searchQuery.trim()) {
            const expanded: { [key: string]: boolean } = {};
            filteredData.forEach((section, sectionIdx) => {
                section.questions.forEach((_, itemIdx) => {
                    expanded[`${sectionIdx}-${itemIdx}`] = true;
                });
            });
            return expanded;
        }
        return openItems;
    }, [searchQuery, filteredData, openItems]);

    const totalResults = filteredData.reduce((acc, section) => acc + section.questions.length, 0);

    return (
        <div className="min-h-screen bg-black text-white py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Back Link */}
                <Link href="/" className="flex items-center text-gray-400 hover:text-white mb-8 transition-colors">
                    <ArrowLeft size={18} className="mr-2" />
                    Back to Home
                </Link>

                {/* Page Header */}
                <div className="text-center mb-12">
                    <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <HelpCircle className="text-red-500" size={32} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Frequently Asked Questions</h1>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Find answers to common questions about orders, shipping, returns, and more.
                    </p>
                </div>

                {/* Search Bar */}
                <div className="mb-12">
                    <div className="relative max-w-xl mx-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search for answers... (e.g. shipping, return, size)"
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-12 pr-12 py-4 text-white placeholder-gray-500 focus:border-red-500 focus:outline-none transition-colors"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>
                    {searchQuery && (
                        <p className="text-center text-sm text-gray-500 mt-3">
                            Found <span className="text-white font-semibold">{totalResults}</span> result{totalResults !== 1 ? 's' : ''} for "{searchQuery}"
                        </p>
                    )}
                </div>

                {/* FAQ Sections */}
                {filteredData.length > 0 ? (
                    <div className="space-y-12">
                        {filteredData.map((section, sectionIdx) => (
                            <div key={sectionIdx}>
                                <h2 className="text-xl font-bold mb-6 text-red-500">{section.category}</h2>
                                <div className="space-y-3">
                                    {section.questions.map((item, itemIdx) => {
                                        const key = `${sectionIdx}-${itemIdx}`;
                                        const isOpen = effectiveOpenItems[key];

                                        return (
                                            <div
                                                key={key}
                                                className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden"
                                            >
                                                <button
                                                    onClick={() => !searchQuery && toggleItem(key)}
                                                    className={`w-full flex items-center justify-between p-4 text-left transition-colors ${!searchQuery ? 'hover:bg-zinc-800/50' : ''}`}
                                                >
                                                    <span className="font-medium pr-4">{item.q}</span>
                                                    {!searchQuery && (
                                                        <ChevronDown
                                                            size={20}
                                                            className={`text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                                        />
                                                    )}
                                                </button>
                                                {isOpen && (
                                                    <div className="px-4 pb-4 text-sm text-gray-400 border-t border-zinc-800 pt-4">
                                                        {item.a}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <p className="text-gray-400 mb-4">No results found for "{searchQuery}"</p>
                        <button
                            onClick={() => setSearchQuery("")}
                            className="text-red-500 hover:underline"
                        >
                            Clear search
                        </button>
                    </div>
                )}

                {/* Still need help */}
                <div className="mt-16 text-center bg-gradient-to-r from-red-600/20 to-purple-600/20 border border-zinc-800 rounded-lg p-8">
                    <h2 className="text-xl font-bold mb-2">Still have questions?</h2>
                    <p className="text-gray-400 mb-6">Can't find what you're looking for? Our support team is here to help.</p>
                    <Link href="/contact">
                        <button className="bg-white text-black px-8 py-3 rounded font-bold hover:bg-gray-200 transition-colors">
                            Contact Support
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
