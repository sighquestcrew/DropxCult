"use client";
import { useState, useEffect } from "react";
import { Search, Download, History, RefreshCw, X, Shield, User, AlertTriangle, CheckCircle, XCircle, Activity, Clock, Filter } from "lucide-react";

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

interface Stats {
    total: number;
    success: number;
    failed: number;
    adminActions: number;
    userActions: number;
    todayCount: number;
}

const actionColors: Record<string, string> = {
    LOGIN: "bg-green-500/20 text-green-400",
    LOGOUT: "bg-gray-500/20 text-gray-400",
    LOGIN_FAILED: "bg-red-500/20 text-red-400",
    REGISTER: "bg-blue-500/20 text-blue-400",
    CREATE: "bg-purple-500/20 text-purple-400",
    UPDATE: "bg-yellow-500/20 text-yellow-400",
    DELETE: "bg-red-500/20 text-red-400",
    APPROVE: "bg-green-500/20 text-green-400",
    REJECT: "bg-red-500/20 text-red-400",
    STATUS_CHANGE: "bg-orange-500/20 text-orange-400",
    PAYMENT: "bg-emerald-500/20 text-emerald-400",
    REFUND: "bg-pink-500/20 text-pink-400",
};

const actionIcons: Record<string, string> = {
    LOGIN: "🔓",
    LOGOUT: "🚪",
    LOGIN_FAILED: "🚫",
    REGISTER: "📝",
    CREATE: "➕",
    UPDATE: "✏️",
    DELETE: "🗑️",
    APPROVE: "✅",
    REJECT: "❌",
    STATUS_CHANGE: "🔄",
    PAYMENT: "💰",
    REFUND: "💸",
};

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    // Filters
    const [search, setSearch] = useState("");
    const [actionFilter, setActionFilter] = useState("");
    const [entityFilter, setEntityFilter] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
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
            if (roleFilter) params.set("role", roleFilter);
            if (statusFilter) params.set("status", statusFilter);

            const res = await fetch(`/api/audit-logs?${params}`);
            const data = await res.json();
            setLogs(data.logs || []);
            setPagination(data.pagination);

            // Calculate stats from response or set defaults
            if (data.stats) {
                setStats(data.stats);
            }
        } catch (error) {
            console.error("Failed to fetch logs:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page, actionFilter, entityFilter, roleFilter, statusFilter]);

    const handleSearch = () => {
        setPage(1);
        fetchLogs();
    };

    const clearFilters = () => {
        setSearch("");
        setActionFilter("");
        setEntityFilter("");
        setRoleFilter("");
        setStatusFilter("");
        setPage(1);
    };

    const hasActiveFilters = search || actionFilter || entityFilter || roleFilter || statusFilter;

    const exportCSV = () => {
        const csv = [
            ["Time", "User", "Role", "Action", "Entity", "Entity ID", "Status", "IP Address"].join(","),
            ...logs.map(log => [
                new Date(log.createdAt).toISOString(),
                log.userEmail || "-",
                log.userRole || "-",
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

    const getRelativeTime = (date: string) => {
        const now = new Date();
        const then = new Date(date);
        const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

        if (seconds < 60) return "Just now";
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return then.toLocaleDateString();
    };

    return (
        <div className="min-h-screen bg-black text-white">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-600/20 rounded-xl">
                            <History className="w-6 h-6 text-purple-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Audit Logs</h1>
                            <p className="text-gray-500 text-sm">Track all system and admin activities</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={fetchLogs}
                            className="px-4 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 flex items-center gap-2 text-sm"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                        <button
                            onClick={exportCSV}
                            className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-500 flex items-center gap-2 text-sm"
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
                    <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                        <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                            <Activity size={14} />
                            Total Logs
                        </div>
                        <p className="text-2xl font-bold">{pagination?.total || 0}</p>
                    </div>
                    <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                        <div className="flex items-center gap-2 text-green-400 text-xs mb-1">
                            <CheckCircle size={14} />
                            Success
                        </div>
                        <p className="text-2xl font-bold text-green-400">
                            {logs.filter(l => l.status === "SUCCESS").length}
                        </p>
                    </div>
                    <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                        <div className="flex items-center gap-2 text-red-400 text-xs mb-1">
                            <XCircle size={14} />
                            Failed
                        </div>
                        <p className="text-2xl font-bold text-red-400">
                            {logs.filter(l => l.status !== "SUCCESS").length}
                        </p>
                    </div>
                    <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                        <div className="flex items-center gap-2 text-purple-400 text-xs mb-1">
                            <Shield size={14} />
                            Admin Actions
                        </div>
                        <p className="text-2xl font-bold text-purple-400">
                            {logs.filter(l => l.userRole === "admin").length}
                        </p>
                    </div>
                    <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                        <div className="flex items-center gap-2 text-blue-400 text-xs mb-1">
                            <User size={14} />
                            User Actions
                        </div>
                        <p className="text-2xl font-bold text-blue-400">
                            {logs.filter(l => l.userRole === "user").length}
                        </p>
                    </div>
                    <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                        <div className="flex items-center gap-2 text-yellow-400 text-xs mb-1">
                            <AlertTriangle size={14} />
                            Login Failed
                        </div>
                        <p className="text-2xl font-bold text-yellow-400">
                            {logs.filter(l => l.action === "LOGIN_FAILED").length}
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-zinc-900 rounded-xl p-4 mb-6 border border-zinc-800">
                    <div className="flex flex-wrap gap-3">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by email or entity ID..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                    className="w-full pl-10 pr-4 py-2 bg-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                        </div>

                        <select
                            value={roleFilter}
                            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                            className="px-4 py-2 bg-zinc-800 rounded-lg text-sm border-none"
                        >
                            <option value="">All Roles</option>
                            <option value="admin">🛡️ Admin Only</option>
                            <option value="user">👤 Users Only</option>
                        </select>

                        <select
                            value={actionFilter}
                            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                            className="px-4 py-2 bg-zinc-800 rounded-lg text-sm border-none"
                        >
                            <option value="">All Actions</option>
                            <option value="LOGIN">🔓 Login</option>
                            <option value="LOGOUT">🚪 Logout</option>
                            <option value="LOGIN_FAILED">🚫 Login Failed</option>
                            <option value="REGISTER">📝 Register</option>
                            <option value="CREATE">➕ Create</option>
                            <option value="UPDATE">✏️ Update</option>
                            <option value="DELETE">🗑️ Delete</option>
                            <option value="APPROVE">✅ Approve</option>
                            <option value="REJECT">❌ Reject</option>
                            <option value="STATUS_CHANGE">🔄 Status Change</option>
                            <option value="PAYMENT">💰 Payment</option>
                            <option value="REFUND">💸 Refund</option>
                        </select>

                        <select
                            value={entityFilter}
                            onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
                            className="px-4 py-2 bg-zinc-800 rounded-lg text-sm border-none"
                        >
                            <option value="">All Entities</option>
                            <option value="User">User</option>
                            <option value="Order">Order</option>
                            <option value="Design">Design</option>
                            <option value="Product">Product</option>
                            <option value="CustomRequest">Custom Request</option>
                        </select>

                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                            className="px-4 py-2 bg-zinc-800 rounded-lg text-sm border-none"
                        >
                            <option value="">All Status</option>
                            <option value="SUCCESS">✅ Success</option>
                            <option value="FAILURE">❌ Failed</option>
                            <option value="DENIED">🚫 Denied</option>
                        </select>

                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg text-sm hover:bg-red-600/30 flex items-center gap-2"
                            >
                                <X size={14} />
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-zinc-800/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Time</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">User</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Action</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Entity</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">IP</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {loading ? (
                                    <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        Loading logs...
                                    </td></tr>
                                ) : logs.length === 0 ? (
                                    <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                                        <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                        No audit logs found
                                    </td></tr>
                                ) : (
                                    logs.map((log) => (
                                        <tr
                                            key={log.id}
                                            className="hover:bg-zinc-800/50 cursor-pointer transition-colors"
                                            onClick={() => setSelectedLog(log)}
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Clock size={14} className="text-gray-500" />
                                                    <div>
                                                        <p className="text-white">{getRelativeTime(log.createdAt)}</p>
                                                        <p className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className={`p-1.5 rounded-full ${log.userRole === "admin" ? "bg-purple-500/20" : "bg-blue-500/20"}`}>
                                                        {log.userRole === "admin" ? <Shield size={14} className="text-purple-400" /> : <User size={14} className="text-blue-400" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-white text-sm">{log.userEmail || "-"}</p>
                                                        <p className={`text-xs ${log.userRole === "admin" ? "text-purple-400" : "text-gray-500"}`}>
                                                            {log.userRole || "unknown"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded text-xs font-medium inline-flex items-center gap-1 ${actionColors[log.action] || "bg-gray-600 text-gray-300"}`}>
                                                    <span>{actionIcons[log.action] || "•"}</span>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="text-white text-sm">{log.entity}</p>
                                                    <p className="text-xs text-gray-500 font-mono">
                                                        {log.entityId ? log.entityId.slice(0, 12) + "..." : "-"}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded text-xs inline-flex items-center gap-1 ${log.status === "SUCCESS" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                                                    {log.status === "SUCCESS" ? <CheckCircle size={12} /> : <XCircle size={12} />}
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
                                className="px-3 py-1.5 bg-zinc-800 rounded-lg disabled:opacity-50 text-sm hover:bg-zinc-700"
                            >
                                Previous
                            </button>
                            <span className="px-3 py-1.5 text-sm">{page} / {pagination.totalPages}</span>
                            <button
                                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                disabled={page === pagination.totalPages}
                                className="px-3 py-1.5 bg-zinc-800 rounded-lg disabled:opacity-50 text-sm hover:bg-zinc-700"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedLog && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setSelectedLog(null)}>
                    <div className="bg-zinc-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-zinc-700 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header - Big Banner */}
                        <div className={`p-6 ${selectedLog.status === "SUCCESS" ? "bg-gradient-to-r from-green-900/50 to-emerald-900/30" : "bg-gradient-to-r from-red-900/50 to-rose-900/30"} border-b border-zinc-700`}>
                            <div className="flex items-start justify-between">
                                <div className="space-y-3">
                                    {/* Action Badge */}
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <span className={`px-4 py-2 rounded-xl text-lg font-bold inline-flex items-center gap-2 ${actionColors[selectedLog.action] || "bg-gray-600"}`}>
                                            <span className="text-2xl">{actionIcons[selectedLog.action]}</span>
                                            {selectedLog.action}
                                        </span>
                                        {selectedLog.userRole === "admin" && (
                                            <span className="px-3 py-1.5 bg-purple-500/30 text-purple-300 rounded-lg text-sm font-medium flex items-center gap-2 border border-purple-500/50">
                                                <Shield size={14} /> Admin Action
                                            </span>
                                        )}
                                    </div>

                                    {/* Entity Info */}
                                    <div className="flex items-center gap-4 text-gray-300">
                                        <span className="font-medium text-white">{selectedLog.entity}</span>
                                        {selectedLog.entityId && (
                                            <code className="px-2 py-1 bg-black/30 rounded text-xs font-mono">
                                                {selectedLog.entityId.slice(0, 20)}...
                                            </code>
                                        )}
                                    </div>

                                    {/* Status */}
                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${selectedLog.status === "SUCCESS" ? "bg-green-500/30 text-green-300" : "bg-red-500/30 text-red-300"}`}>
                                        {selectedLog.status === "SUCCESS" ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                        {selectedLog.status}
                                    </div>
                                </div>

                                <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-white/10 rounded-lg transition">
                                    <X size={24} className="text-white" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content - Scrollable */}
                        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                            {/* Timeline Header */}
                            <div className="flex items-center gap-3 text-sm text-gray-400">
                                <Clock size={16} />
                                <span>{new Date(selectedLog.createdAt).toLocaleString()}</span>
                                <span className="text-gray-600">•</span>
                                <span>{getRelativeTime(selectedLog.createdAt)}</span>
                            </div>

                            {/* User Card */}
                            <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-full ${selectedLog.userRole === "admin" ? "bg-purple-500/20" : "bg-blue-500/20"}`}>
                                        {selectedLog.userRole === "admin" ? <Shield size={24} className="text-purple-400" /> : <User size={24} className="text-blue-400" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-white text-lg">{selectedLog.userEmail || "Unknown User"}</p>
                                        <p className={`text-sm ${selectedLog.userRole === "admin" ? "text-purple-400" : "text-gray-400"}`}>
                                            {selectedLog.userRole === "admin" ? "🛡️ Administrator" : "👤 User"}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(selectedLog.userId || "");
                                        }}
                                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-gray-400 transition"
                                    >
                                        Copy ID
                                    </button>
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Entity Details */}
                                <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800">
                                    <p className="text-xs text-gray-500 uppercase mb-3 flex items-center gap-2">
                                        <Activity size={12} />
                                        Entity Details
                                    </p>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 text-sm">Type</span>
                                            <span className="text-white font-medium">{selectedLog.entity}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 text-sm">Action</span>
                                            <span className="text-white">{selectedLog.action}</span>
                                        </div>
                                    </div>
                                    {selectedLog.entityId && (
                                        <div className="mt-3 pt-3 border-t border-zinc-800">
                                            <p className="text-xs text-gray-500 mb-1">Entity ID</p>
                                            <code className="text-xs text-green-400 bg-black/50 px-2 py-1 rounded block break-all">
                                                {selectedLog.entityId}
                                            </code>
                                        </div>
                                    )}
                                </div>

                                {/* Request Context */}
                                <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800">
                                    <p className="text-xs text-gray-500 uppercase mb-3 flex items-center gap-2">
                                        <Activity size={12} />
                                        Request Info
                                    </p>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 text-sm">IP Address</span>
                                            <span className="text-white font-mono text-sm">{selectedLog.ipAddress || "-"}</span>
                                        </div>
                                    </div>
                                    {selectedLog.userAgent && (
                                        <div className="mt-3 pt-3 border-t border-zinc-800">
                                            <p className="text-xs text-gray-500 mb-1">User Agent</p>
                                            <p className="text-xs text-gray-400 break-all leading-relaxed">
                                                {selectedLog.userAgent}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Details JSON */}
                            {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                                <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-xs text-gray-500 uppercase flex items-center gap-2">
                                            <Activity size={12} />
                                            Additional Details
                                        </p>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(JSON.stringify(selectedLog.details, null, 2))}
                                            className="text-xs text-gray-500 hover:text-white transition"
                                        >
                                            Copy JSON
                                        </button>
                                    </div>
                                    <pre className="text-sm text-green-400 bg-black p-4 rounded-lg overflow-x-auto font-mono">
                                        {JSON.stringify(selectedLog.details, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {/* Error Message */}
                            {selectedLog.errorMessage && (
                                <div className="bg-red-950/50 border border-red-800 rounded-xl p-4">
                                    <p className="text-sm text-red-400 uppercase mb-2 flex items-center gap-2 font-medium">
                                        <AlertTriangle size={16} />
                                        Error Message
                                    </p>
                                    <p className="text-red-300 bg-red-900/30 p-3 rounded-lg">{selectedLog.errorMessage}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
