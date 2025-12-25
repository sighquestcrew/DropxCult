"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { CheckCircle, XCircle, Clock, DollarSign, User, Calendar, CreditCard } from "lucide-react";
import { toast } from "sonner";

export default function WithdrawalsPage() {
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [selectedDetailRequest, setSelectedDetailRequest] = useState<any>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [action, setAction] = useState<"approve" | "reject">("approve");
    const [adminNote, setAdminNote] = useState("");
    const [transactionId, setTransactionId] = useState("");

    // Fetch withdrawal requests
    const { data, isLoading } = useQuery({
        queryKey: ["admin-withdrawals", statusFilter],
        queryFn: async () => {
            const url = statusFilter
                ? `/api/withdrawals?status=${statusFilter}`
                : "/api/withdrawals";
            const { data } = await axios.get(url);
            return data;
        }
    });

    // Mutation to approve/reject
    const processRequestMutation = useMutation({
        mutationFn: async ({ id, action, adminNote, transactionId }: any) => {
            const { data } = await axios.patch(`/api/withdrawals/${id}`, {
                action,
                adminNote,
                transactionId
            });
            return data;
        },
        onSuccess: () => {
            toast.success(`Request ${action === "approve" ? "approved" : "rejected"}!`);
            queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
            setModalOpen(false);
            setSelectedRequest(null);
            setAdminNote("");
            setTransactionId("");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || "Failed to process request");
        }
    });

    const handleProcess = () => {
        if (!selectedRequest) return;
        processRequestMutation.mutate({
            id: selectedRequest.id,
            action,
            adminNote,
            transactionId: action === "approve" ? transactionId : null
        });
    };

    const requests = data?.requests || [];

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Withdrawal Requests</h1>
                    <p className="text-gray-400 mt-1">Review and process designer payouts</p>
                </div>
            </div>

            {/* Status Filters */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setStatusFilter(null)}
                    className={`px-4 py-2 rounded-lg font-medium ${statusFilter === null
                        ? "bg-blue-600 text-white"
                        : "bg-zinc-800 text-gray-400 hover:bg-zinc-700"
                        }`}
                >
                    All ({requests.length})
                </button>
                <button
                    onClick={() => setStatusFilter("pending")}
                    className={`px-4 py-2 rounded-lg font-medium ${statusFilter === "pending"
                        ? "bg-yellow-600 text-white"
                        : "bg-zinc-800 text-gray-400 hover:bg-zinc-700"
                        }`}
                >
                    Pending
                </button>
                <button
                    onClick={() => setStatusFilter("processed")}
                    className={`px-4 py-2 rounded-lg font-medium ${statusFilter === "processed"
                        ? "bg-green-600 text-white"
                        : "bg-zinc-800 text-gray-400 hover:bg-zinc-700"
                        }`}
                >
                    Processed
                </button>
                <button
                    onClick={() => setStatusFilter("rejected")}
                    className={`px-4 py-2 rounded-lg font-medium ${statusFilter === "rejected"
                        ? "bg-red-600 text-white"
                        : "bg-zinc-800 text-gray-400 hover:bg-zinc-700"
                        }`}
                >
                    Rejected
                </button>
            </div>

            {/* Requests Table */}
            {isLoading ? (
                <div className="text-center py-12 text-gray-400">Loading...</div>
            ) : requests.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    No withdrawal requests found
                </div>
            ) : (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-zinc-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-sm font-semibold">User</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold">Amount</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold">Bank Details</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {requests.map((request: any) => (
                                <tr
                                    key={request.id}
                                    onClick={() => setSelectedDetailRequest(request)}
                                    className="hover:bg-zinc-800/50 cursor-pointer"
                                >
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-medium">{request.userName}</p>
                                            <p className="text-sm text-gray-400">{request.userEmail}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-green-500">₹{request.amount}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm">
                                            <p><span className="text-gray-500">Name:</span> {request.accountName}</p>
                                            <p><span className="text-gray-500">Bank:</span> {request.bankName}</p>
                                            <p><span className="text-gray-500">IFSC:</span> {request.ifscCode}</p>
                                            <p><span className="text-gray-500">A/C:</span> ****{request.accountNumber.slice(-4)}</p>
                                            {request.upiId && (
                                                <p><span className="text-gray-500">UPI:</span> {request.upiId}</p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-gray-400">
                                            {new Date(request.createdAt).toLocaleDateString()}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-bold ${request.status === "pending"
                                                ? "bg-yellow-500/20 text-yellow-500"
                                                : request.status === "processed"
                                                    ? "bg-green-500/20 text-green-500"
                                                    : "bg-red-500/20 text-red-500"
                                                }`}
                                        >
                                            {request.status.toUpperCase()}
                                        </span>
                                        {request.adminNote && (
                                            <p className="text-xs text-gray-500 mt-1">{request.adminNote}</p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {request.status === "pending" ? (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedRequest(request);
                                                        setAction("approve");
                                                        setModalOpen(true);
                                                    }}
                                                    className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm font-medium"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedRequest(request);
                                                        setAction("reject");
                                                        setModalOpen(true);
                                                    }}
                                                    className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm font-medium"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-500">
                                                {request.transactionId || "-"}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Approval Modal */}
            {modalOpen && selectedRequest && (
                <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold mb-4">
                            {action === "approve" ? "Approve" : "Reject"} Withdrawal Request
                        </h3>

                        <div className="bg-zinc-800 rounded-lg p-4 mb-4">
                            <p className="text-sm text-gray-400 mb-2">User: <span className="text-white">{selectedRequest.userName}</span></p>
                            <p className="text-sm text-gray-400 mb-2">Amount: <span className="text-green-500 font-bold">₹{selectedRequest.amount}</span></p>
                            <p className="text-sm text-gray-400">Bank: <span className="text-white">{selectedRequest.bankName}</span></p>
                        </div>

                        {action === "approve" && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Transaction ID</label>
                                <input
                                    type="text"
                                    value={transactionId}
                                    onChange={(e) => setTransactionId(e.target.value)}
                                    placeholder="Enter payment transaction ID"
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2"
                                />
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Admin Note (Optional)</label>
                            <textarea
                                value={adminNote}
                                onChange={(e) => setAdminNote(e.target.value)}
                                placeholder="Add a note for this action..."
                                rows={3}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2"
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleProcess}
                                disabled={processRequestMutation.isPending}
                                className={`flex-1 py-2 rounded-lg font-medium ${action === "approve"
                                    ? "bg-green-600 hover:bg-green-700"
                                    : "bg-red-600 hover:bg-red-700"
                                    } disabled:opacity-50`}
                            >
                                {processRequestMutation.isPending ? "Processing..." : `Confirm ${action === "approve" ? "Approval" : "Rejection"}`}
                            </button>
                            <button
                                onClick={() => {
                                    setModalOpen(false);
                                    setSelectedRequest(null);
                                    setAdminNote("");
                                    setTransactionId("");
                                }}
                                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Preview Modal */}
            {selectedDetailRequest && (
                <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50" onClick={() => setSelectedDetailRequest(null)}>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold">Withdrawal Request Details</h3>
                            <button onClick={() => setSelectedDetailRequest(null)} className="text-gray-400 hover:text-white">
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* User Info */}
                            <div className="bg-zinc-800 rounded-lg p-4">
                                <h4 className="font-semibold mb-2">User Information</h4>
                                <p className="text-sm"><span className="text-gray-400">Name:</span> {selectedDetailRequest.userName}</p>
                                <p className="text-sm"><span className="text-gray-400">Email:</span> {selectedDetailRequest.userEmail}</p>
                            </div>

                            {/* Amount & Status */}
                            <div className="bg-zinc-800 rounded-lg p-4">
                                <h4 className="font-semibold mb-2">Request Details</h4>
                                <p className="text-sm"><span className="text-gray-400">Amount:</span> <span className="text-green-500 font-bold">₹{selectedDetailRequest.amount}</span></p>
                                <p className="text-sm"><span className="text-gray-400">Status:</span> <span className={`px-2 py-1 rounded text-xs ${selectedDetailRequest.status === "pending" ? "bg-yellow-500/20 text-yellow-500" :
                                        selectedDetailRequest.status === "processed" ? "bg-green-500/20 text-green-500" :
                                            "bg-red-500/20 text-red-500"
                                    }`}>{selectedDetailRequest.status.toUpperCase()}</span></p>
                                <p className="text-sm"><span className="text-gray-400">Requested:</span> {new Date(selectedDetailRequest.createdAt).toLocaleString()}</p>
                            </div>

                            {/* Bank Details */}
                            <div className="bg-zinc-800 rounded-lg p-4">
                                <h4 className="font-semibold mb-2">Bank Account Details</h4>
                                <p className="text-sm"><span className="text-gray-400">Account Name:</span> {selectedDetailRequest.accountName}</p>
                                <p className="text-sm"><span className="text-gray-400">Account Number:</span> {selectedDetailRequest.accountNumber}</p>
                                <p className="text-sm"><span className="text-gray-400">IFSC Code:</span> {selectedDetailRequest.ifscCode}</p>
                                <p className="text-sm"><span className="text-gray-400">Bank Name:</span> {selectedDetailRequest.bankName}</p>
                                {selectedDetailRequest.upiId && (
                                    <p className="text-sm"><span className="text-gray-400">UPI ID:</span> {selectedDetailRequest.upiId}</p>
                                )}
                            </div>

                            {/* Admin Info (if processed) */}
                            {selectedDetailRequest.status !== "pending" && (
                                <div className="bg-zinc-800 rounded-lg p-4">
                                    <h4 className="font-semibold mb-2">Processing Information</h4>
                                    {selectedDetailRequest.processedAt && (
                                        <p className="text-sm"><span className="text-gray-400">Processed At:</span> {new Date(selectedDetailRequest.processedAt).toLocaleString()}</p>
                                    )}
                                    {selectedDetailRequest.processedBy && (
                                        <p className="text-sm"><span className="text-gray-400">Processed By:</span> {selectedDetailRequest.processedBy}</p>
                                    )}
                                    {selectedDetailRequest.adminNote && (
                                        <p className="text-sm"><span className="text-gray-400">Note:</span> {selectedDetailRequest.adminNote}</p>
                                    )}
                                    {selectedDetailRequest.transactionId && (
                                        <p className="text-sm"><span className="text-gray-400">Transaction ID:</span> {selectedDetailRequest.transactionId}</p>
                                    )}
                                </div>
                            )}

                            {/* Actions (only for pending) */}
                            {selectedDetailRequest.status === "pending" && (
                                <div className="flex gap-2 pt-4 border-t border-zinc-700">
                                    <button
                                        onClick={() => {
                                            setSelectedRequest(selectedDetailRequest);
                                            setAction("approve");
                                            setSelectedDetailRequest(null);
                                            setModalOpen(true);
                                        }}
                                        className="flex-1 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedRequest(selectedDetailRequest);
                                            setAction("reject");
                                            setSelectedDetailRequest(null);
                                            setModalOpen(true);
                                        }}
                                        className="flex-1 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium"
                                    >
                                        Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
