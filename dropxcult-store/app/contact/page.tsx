"use client";

import { useState } from "react";
import { Mail, MapPin, Disc as Discord, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

export default function ContactPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Gather form data
        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get("name"),
            email: formData.get("email"),
            subject: formData.get("subject"),
            message: formData.get("message"),
        };

        try {
            await axios.post("/api/contact", data);
            toast.success("Message sent! The Cult will respond shortly.");
            (e.target as HTMLFormElement).reset();
        } catch (error) {
            toast.error("Failed to send message. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white pt-24 pb-12">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 sm:gap-24">

                    {/* Contact Info */}
                    <div>
                        <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter uppercase">
                            Summon <span className="text-red-600">The Cult</span>
                        </h1>
                        <p className="text-gray-400 text-lg mb-12">
                            Have questions about your order, custom designs, or just want to chat?
                            Reach out to our support team or join the community on Discord.
                        </p>

                        <div className="space-y-8">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-zinc-900 rounded-lg">
                                    <Mail className="text-red-600" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">Email Support</h3>
                                    <p className="text-gray-500 mb-1">For orders and general inquiries</p>
                                    <a href="mailto:support@dropxcult.com" className="text-white hover:text-red-500 transition">
                                        support@dropxcult.com
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-zinc-900 rounded-lg">
                                    <Discord className="text-indigo-500" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">Community Server</h3>
                                    <p className="text-gray-500 mb-1">Join 50,000+ members</p>
                                    <a href="#" className="text-white hover:text-indigo-500 transition">
                                        discord.gg/dropxcult
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-zinc-900 rounded-lg">
                                    <MapPin className="text-white" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">Headquarters</h3>
                                    <p className="text-gray-500">
                                        Plot-404, Cyber City<br />
                                        Bangalore, India 560100
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="bg-zinc-900/50 border border-zinc-800 p-6 sm:p-10 rounded-2xl">
                        <h2 className="text-2xl font-bold mb-6">Send a Message</h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Name</label>
                                    <input
                                        required
                                        name="name"
                                        type="text"
                                        placeholder="John Doe"
                                        className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-white focus:border-red-600 focus:outline-none transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Email</label>
                                    <input
                                        required
                                        name="email"
                                        type="email"
                                        placeholder="john@example.com"
                                        className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-white focus:border-red-600 focus:outline-none transition"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Subject</label>
                                <select name="subject" className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-white focus:border-red-600 focus:outline-none transition">
                                    <option>Order Status</option>
                                    <option>Custom Design Inquiry</option>
                                    <option>Returns & Exchanges</option>
                                    <option>Bug Report</option>
                                    <option>Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Message</label>
                                <textarea
                                    required
                                    name="message"
                                    rows={5}
                                    placeholder="How can we help you?"
                                    className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-white focus:border-red-600 focus:outline-none transition resize-none"
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-lg uppercase tracking-widest transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="animate-spin" /> Sending...
                                    </>
                                ) : (
                                    <>
                                        Send Message <Send size={18} />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                </div>
            </div>
        </div>
    );
}
