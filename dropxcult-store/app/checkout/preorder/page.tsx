"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Clock, Truck, AlertTriangle, CheckCircle } from "lucide-react";
import Image from "next/image";

declare global {
    interface Window {
        Razorpay: any;
    }
}

interface Campaign {
    id: string;
    name: string;
    endDate: string;
    minQuantity: number;
    totalQuantity: number;
    progress: number;
    expectedDelivery: string;
    deliveryDays: number;
}

interface Product {
    id: string;
    name: string;
    price: number;
    images: string[];
}

export default function PreOrderCheckoutPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const campaignId = searchParams.get("campaignId");
    const productId = searchParams.get("productId");
    const size = searchParams.get("size");
    const qtyParam = searchParams.get("qty");
    const qty = qtyParam ? parseInt(qtyParam) : 1;

    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);

    // Address form
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [postalCode, setPostalCode] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            if (!campaignId || !productId) {
                toast.error("Invalid checkout link");
                router.push("/");
                return;
            }

            try {
                // Fetch campaign
                const { data: campaignData } = await axios.get(`/api/preorder-campaigns?productId=${productId}`);
                if (!campaignData.campaign) {
                    toast.error("Campaign not found or ended");
                    router.push("/");
                    return;
                }
                setCampaign(campaignData.campaign);

                // Fetch product - get all and filter by ID since API expects slug
                const { data: products } = await axios.get(`/api/products`);
                const productList = Array.isArray(products) ? products : (products.products || []);
                const foundProduct = productList.find((p: Product) => p.id === productId);
                if (!foundProduct) {
                    toast.error("Product not found");
                    router.push("/");
                    return;
                }
                setProduct(foundProduct);

            } catch (error) {
                toast.error("Failed to load checkout");
                router.push("/");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [campaignId, productId, router]);

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
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

    const handlePayment = async () => {
        if (!termsAccepted) {
            toast.error("Please accept the pre-order terms");
            return;
        }

        if (!fullName || !phone || !address || !city || !state || !postalCode) {
            toast.error("Please fill all address fields");
            return;
        }

        const userInfo = localStorage.getItem("storeUserInfo");
        if (!userInfo) {
            toast.error("Please login to continue");
            router.push("/login");
            return;
        }

        const token = JSON.parse(userInfo).token;
        const totalAmount = product!.price * qty;

        setProcessing(true);

        try {
            // Create Razorpay order
            const { data: orderData } = await axios.post("/api/payment/create-order", {
                amount: totalAmount
            });

            const loaded = await loadRazorpay();
            if (!loaded) {
                toast.error("Payment system failed to load");
                setProcessing(false);
                return;
            }

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: orderData.amount,
                currency: "INR",
                name: "DropXCult",
                description: `Pre-Order: ${product!.name}`,
                order_id: orderData.id,
                handler: async (response: any) => {
                    try {
                        // Create pre-order after payment success
                        const { data: preOrderData } = await axios.post("/api/preorder-campaigns", {
                            campaignId,
                            items: [{ productId, size, quantity: qty }],
                            shippingAddress: {
                                fullName, phone, address, city, state, postalCode, country: "India"
                            },
                            phone,
                            paymentId: response.razorpay_payment_id
                        }, {
                            headers: { Authorization: `Bearer ${token}` }
                        });

                        toast.success("Pre-order placed successfully!");
                        router.push(`/order-success?orderNumber=${preOrderData.orderNumber}&type=preorder`);

                    } catch (error: any) {
                        toast.error(error.response?.data?.error || "Failed to create pre-order");
                    }
                },
                prefill: {
                    name: fullName,
                    contact: phone
                },
                theme: {
                    color: "#9333ea"
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (error: any) {
            toast.error(error.response?.data?.error || "Payment failed");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="animate-spin text-purple-500" size={40} />
            </div>
        );
    }

    if (!campaign || !product) {
        return null;
    }

    const totalAmount = product.price * qty;
    const formatDate = (date: string) => new Date(date).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
    });

    return (
        <div className="min-h-screen bg-black text-white py-10 px-4">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8 text-center">Pre-Order Checkout</h1>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Order Summary */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                        <h2 className="font-bold text-lg mb-4">Order Summary</h2>

                        <div className="flex gap-4 mb-6">
                            <div className="w-20 h-20 bg-zinc-800 rounded overflow-hidden">
                                {product.images?.[0] && (
                                    <Image
                                        src={product.images[0]}
                                        alt={product.name}
                                        width={80}
                                        height={80}
                                        className="object-cover w-full h-full"
                                        unoptimized
                                    />
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold">{product.name}</h3>
                                <p className="text-sm text-gray-400">Size: {size} × {qty}</p>
                                <p className="text-lg font-bold text-purple-400">₹{product.price}</p>
                            </div>
                        </div>

                        {/* Campaign Info */}
                        <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-4 mb-4">
                            <div className="flex items-center gap-2 text-purple-300 mb-2">
                                <Clock size={16} />
                                <span className="text-sm font-bold">Pre-Order Campaign</span>
                            </div>
                            <p className="text-xs text-gray-400 mb-2">{campaign.name}</p>
                            <div className="flex justify-between text-xs mb-1">
                                <span>{campaign.totalQuantity} / {campaign.minQuantity} orders</span>
                                <span className={campaign.progress >= 100 ? "text-green-400" : "text-purple-400"}>
                                    {campaign.progress}%
                                </span>
                            </div>
                            <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                                    style={{ width: `${Math.min(100, campaign.progress)}%` }}
                                />
                            </div>
                        </div>

                        {/* Delivery Info */}
                        <div className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg mb-4">
                            <Truck size={18} className="text-purple-400" />
                            <div className="text-sm">
                                <p className="text-white">Expected: {formatDate(campaign.expectedDelivery)}</p>
                                <p className="text-xs text-gray-500">{campaign.deliveryDays} days after campaign closes</p>
                            </div>
                        </div>

                        {/* Total */}
                        <div className="border-t border-zinc-700 pt-4">
                            <div className="flex justify-between text-lg font-bold">
                                <span>Total</span>
                                <span>₹{totalAmount.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                        <h2 className="font-bold text-lg mb-4">Shipping Address</h2>

                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Full Name *"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                            />
                            <input
                                type="tel"
                                placeholder="Phone Number *"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                            />
                            <textarea
                                placeholder="Full Address *"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                rows={2}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    placeholder="City *"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                />
                                <input
                                    type="text"
                                    placeholder="State *"
                                    value={state}
                                    onChange={(e) => setState(e.target.value)}
                                    className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                />
                            </div>
                            <input
                                type="text"
                                placeholder="PIN Code *"
                                value={postalCode}
                                onChange={(e) => setPostalCode(e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                            />
                        </div>

                        {/* Terms */}
                        <div className="mt-6 p-4 bg-zinc-800 rounded-lg">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={termsAccepted}
                                    onChange={(e) => setTermsAccepted(e.target.checked)}
                                    className="mt-1"
                                />
                                <span className="text-xs text-gray-400">
                                    I understand this is a <strong>pre-order</strong>. Full payment is required now.
                                    If minimum orders ({campaign.minQuantity}) are not met, I will receive a <strong>full refund</strong>.
                                    Delivery will take approximately {campaign.deliveryDays} days after the campaign closes.
                                </span>
                            </label>
                        </div>

                        {/* Pay Button */}
                        <button
                            onClick={handlePayment}
                            disabled={processing}
                            className="w-full mt-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {processing ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    <ShieldCheck size={20} />
                                    Pay ₹{totalAmount.toLocaleString()}
                                </>
                            )}
                        </button>

                        {/* Trust Badges */}
                        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                                <ShieldCheck size={14} /> Secure Payment
                            </span>
                            <span className="flex items-center gap-1">
                                <CheckCircle size={14} /> Refund Guaranteed
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
