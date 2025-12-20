
import prisma from "@/lib/prisma";
import dayjs from "dayjs";
import { Mail, MessageCircle, Clock, CheckCircle } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function InquiriesPage() {
    const inquiries = await prisma.inquiry.findMany({
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-8">User Inquiries</h1>

            <div className="grid gap-4">
                {inquiries.map((inquiry) => (
                    <div key={inquiry.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl flex flex-col md:flex-row gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <span className={`px-2 py-1 text-xs font-bold rounded-full border ${inquiry.status === "Pending"
                                        ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"
                                        : "bg-green-500/20 text-green-500 border-green-500/30"
                                    }`}>
                                    {inquiry.status}
                                </span>
                                <span className="text-gray-500 text-xs flex items-center gap-1">
                                    <Clock size={12} />
                                    {dayjs(inquiry.createdAt).format("DD MMM YYYY, hh:mm A")}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold mb-1">{inquiry.subject}</h3>
                            <p className="text-gray-300 text-sm mb-4 leading-relaxed bg-black/50 p-4 rounded-lg border border-zinc-800">
                                {inquiry.message}
                            </p>

                            <div className="flex items-center gap-4 text-sm text-gray-400">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-zinc-800 rounded-full">
                                        <span className="font-bold text-white">{inquiry.name.charAt(0).toUpperCase()}</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-white">{inquiry.name}</p>
                                        <p className="text-xs">{inquiry.email}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col justify-center gap-2 min-w-[150px]">
                            <a href={`mailto:${inquiry.email}`} className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition">
                                <Mail size={16} /> Reply
                            </a>
                        </div>
                    </div>
                ))}

                {inquiries.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No inquiries found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
