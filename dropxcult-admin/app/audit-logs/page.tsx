"use client";
import { useState, useEffect } from "react";
import { Search, Filter, Download, History, RefreshCw, X } from "lucide-react";

interface AuditLog {
    id: string;
    userId: string | null;
    userEmail: string | null;
    userRole: string | null;
    action: string;
    entity: string;
    entityId: string | null;
    details: any;
    status: string;
    ipAddress: string | null;
    userAgent: string | null;
    errorMessage: string | null;
    createdAt: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

const actionColors: Record<string, string> = {
    LOGIN: "bg-green-500/20 text-green-400",
    LOGIN_FAILED: "bg-red-500/20 text-red-400",
    REGISTER: "bg-blue-500/20 text-blue-400",
    CREATE: "bg-purple-500/20 text-purple-400",
    UPDATE: "bg-yellow-500/20 text-yellow-400",
    DELETE: "bg-red-500/20 text-red-400",
    APPROVE: "bg-green-500/20 text-green-400",
    REJECT: "bg-red-500/20 text-red-400",
    STATUS_CHANGE: "bg-orange-500/20 text-orange-400",
};

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    // Filters
    const [search, setSearch] = useState("");
    const [actionFilter, setActionFilter] = useState("");
    const [entityFilter, setEntityFilter] = useState("");
    const [page, setPage] = useState(1);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set("page", page.toString());
            params.set("limit", "25");
            if (search) params.set("search", search);
            if (actionFilter) params.set("action", actionFilter);
            if (entityFilter) params.set("entity", entityFilter);

            const res = await fetch(`/api/audit-logs?${params}`);
            const data = await res.json();
            setLogs(data.logs || []);
            setPagination(data.pagination);
        } catch (error) {
            console.error("Failed to fetch logs:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page, actionFilter, entityFilter]);

    const handleSearch = () => {
        setPage(1);
        fetchLogs();
    };

    const exportCSV = () => {
        const csv = [
            ["Time", "User", "Action", "Entity", "Entity ID", "Status", "IP Address"].join(","),
            ...logs.map(log => [
                new Date(log.createdAt).toISOString(),
                log.userEmail || "-",
                log.action,
                log.entity,
                log.entityId || "-",
                log.status,
                log.ipAddress || "-"
            ].join(","))
        ].join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <History className="w-8 h-8 text-purple-500" />
                        <h1 className="text-2xl font-bold">Audit Logs</h1>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={fetchLogs}
                            className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                        <button
                            onClick={exportCSV}
                            className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-500 flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-gray-800 rounded-xl p-4 mb-6 flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by email or entity ID..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                className="w-full pl-10 pr-4 py-2 bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                    </div>

                    <select
                        value={actionFilter}
                        onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                        className="px-4 py-2 bg-gray-700 rounded-lg text-sm"
                    >
                        <option value="">All Actions</option>
                        <option value="LOGIN">Login</option>
                        <option value="LOGIN_FAILED">Login Failed</option>
                        <option value="REGISTER">Register</option>
                        <option value="APPROVE">Approve</option>
                        <option value="REJECT">Reject</option>
                        <option value="STATUS_CHANGE">Status Change</option>
                        <option value="CREATE">Create</option>
                        <option value="UPDATE">Update</option>
                        <option value="DELETE">Delete</option>
                    </select>

                    <select
                        value={entityFilter}
                        onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
                        className="px-4 py-2 bg-gray-700 rounded-lg text-sm"
                    >
                        <option value="">All Entities</option>
                        <option value="User">User</option>
                        <option value="Order">Order</option>
                        <option value="Design">Design</option>
                        <option value="Product">Product</option>
                    </select>
                </div>

                {/* Table */}
                <div className="bg-gray-800 rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-700/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Time</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">User</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Action</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Entity</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Entity ID</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">IP</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {loading ? (
                                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No audit logs found</td></tr>
                            ) : (
                                logs.map((log) => (
                                    <tr
                                        key={log.id}
                                        className="hover:bg-gray-700/50 cursor-pointer transition-colors"
                                        onClick={() => setSelectedLog(log)}
                                    >
                                        <td className="px-4 py-3 text-sm text-gray-300">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <div className="flex flex-col">
                                                <span className="text-white">{log.userEmail || "-"}</span>
                                                <span className="text-xs text-gray-500">{log.userRole}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${actionColors[log.action] || "bg-gray-600 text-gray-300"}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-300">{log.entity}</td>
                                        <td className="px-4 py-3 text-sm text-gray-400 font-mono text-xs">
                                            {log.entityId ? log.entityId.slice(0, 12) + "..." : "-"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded text-xs ${log.status === "SUCCESS" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                                                {log.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-400">{log.ipAddress || "-"}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 px-4">
                        <span className="text-sm text-gray-400">
                            Showing {logs.length} of {pagination.total} logs
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <span className="px-3 py-1">{page} / {pagination.totalPages}</span>
                            <button
                                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                disabled={page === pagination.totalPages}
                                className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedLog && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setSelectedLog(null)}>
                    <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-700 sticky top-0 bg-gray-800">
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded text-sm font-medium ${actionColors[selectedLog.action] || "bg-gray-600"}`}>
                                    {selectedLog.action}
                                </span>
                                <span className="text-gray-400">{selectedLog.entity}</span>
                            </div>
                            <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-gray-700 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-4 space-y-4">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase mb-1">Time</p>
                                    <p className="text-white">{new Date(selectedLog.createdAt).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase mb-1">Status</p>
                                    <span className={`px-2 py-1 rounded text-xs ${selectedLog.status === "SUCCESS" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                                        {selectedLog.status}
                                    </span>
                                </div>
                            </div>

                            {/* User Info */}
                            <div className="bg-gray-900 rounded-lg p-3">
                                <p className="text-xs text-gray-500 uppercase mb-2">User Information</p>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div><span className="text-gray-500">Email:</span> <span className="text-white">{selectedLog.userEmail || "-"}</span></div>
                                    <div><span className="text-gray-500">Role:</span> <span className="text-white">{selectedLog.userRole || "-"}</span></div>
                                    <div className="col-span-2"><span className="text-gray-500">User ID:</span> <span className="text-white font-mono text-xs">{selectedLog.userId || "-"}</span></div>
                                </div>
                            </div>

                            {/* Entity Info */}
                            <div className="bg-gray-900 rounded-lg p-3">
                                <p className="text-xs text-gray-500 uppercase mb-2">Entity Information</p>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div><span className="text-gray-500">Entity:</span> <span className="text-white">{selectedLog.entity}</span></div>
                                    <div><span className="text-gray-500">Action:</span> <span className="text-white">{selectedLog.action}</span></div>
                                    <div className="col-span-2"><span className="text-gray-500">Entity ID:</span> <span className="text-white font-mono text-xs">{selectedLog.entityId || "-"}</span></div>
                                </div>
                            </div>

                            {/* Request Context */}
                            <div className="bg-gray-900 rounded-lg p-3">
                                <p className="text-xs text-gray-500 uppercase mb-2">Request Context</p>
                                <div className="space-y-2 text-sm">
                                    <div><span className="text-gray-500">IP Address:</span> <span className="text-white">{selectedLog.ipAddress || "-"}</span></div>
                                    <div><span className="text-gray-500">User Agent:</span> <span className="text-white text-xs break-all">{selectedLog.userAgent || "-"}</span></div>
                                </div>
                            </div>

                            {/* Details JSON */}
                            {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                                <div className="bg-gray-900 rounded-lg p-3">
                                    <p className="text-xs text-gray-500 uppercase mb-2">Additional Details</p>
                                    <pre className="text-xs text-green-400 bg-black p-3 rounded overflow-x-auto">
                                        {JSON.stringify(selectedLog.details, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {/* Error Message */}
                            {selectedLog.errorMessage && (
                                <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
                                    <p className="text-xs text-red-400 uppercase mb-1">Error Message</p>
                                    <p className="text-red-300">{selectedLog.errorMessage}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

