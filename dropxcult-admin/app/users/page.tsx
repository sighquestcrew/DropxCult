"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Loader2, Trash2, Shield, User as UserIcon, ShieldOff, Crown } from "lucide-react";
import { toast } from "sonner";
import dayjs from "dayjs";
import Pagination from "@/components/Pagination";
import { SearchInput, FilterTabs } from "@/components/Filters";
import ExportButton from "@/components/ExportButton";

export default function AdminUsersPage() {
    const queryClient = useQueryClient();

    // Filter state
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [page, setPage] = useState(1);

    // Fetch users with filters
    const { data, isLoading } = useQuery({
        queryKey: ["admin-users", search, roleFilter, page],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            if (roleFilter) params.set("role", roleFilter);
            params.set("page", String(page));
            params.set("limit", "10");

            const { data } = await axios.get(`/api/users?${params.toString()}`);
            return data;
        },
    });

    // Delete User mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await axios.delete(`/api/users/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
            toast.success("User removed from the cult");
        },
        onError: () => {
            toast.error("Failed to delete user");
        },
    });

    // Toggle admin role mutation
    const toggleAdminMutation = useMutation({
        mutationFn: async ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) => {
            await axios.patch(`/api/users/${userId}/role`, { isAdmin });
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
            toast.success(variables.isAdmin ? "User promoted to admin" : "Admin demoted to member");
        },
        onError: () => {
            toast.error("Failed to update user role");
        },
    });

    const users = data?.users || [];
    const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };
    const counts = data?.counts || { all: 0, admin: 0, member: 0 };

    // Tab configuration
    const tabs = [
        { value: "", label: "All", count: counts.all },
        { value: "admin", label: "Admins", count: counts.admin },
        { value: "member", label: "Members", count: counts.member },
    ];

    // Export columns
    const exportColumns = [
        { key: "id", header: "ID" },
        { key: "name", header: "Name" },
        { key: "email", header: "Email" },
        { key: "isAdmin", header: "Admin" },
        { key: "rank", header: "Rank" },
        { key: "ordersCount", header: "Orders" },
        { key: "createdAt", header: "Joined" },
    ];

    if (isLoading) {
        return (
            <div className="p-10 text-white">
                <Loader2 className="animate-spin h-8 w-8 text-red-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold">Cult Members ({pagination.total})</h1>
                <ExportButton data={users} filename="users" columns={exportColumns} />
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <SearchInput
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={(v) => { setSearch(v); setPage(1); }}
                    className="md:w-80"
                />
            </div>

            {/* Role Tabs */}
            <FilterTabs
                tabs={tabs}
                activeTab={roleFilter}
                onTabChange={(v) => { setRoleFilter(v); setPage(1); }}
            />

            {/* Users Table */}
            <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
                <table className="w-full text-left text-gray-400">
                    <thead className="bg-black text-xs uppercase font-bold text-gray-500">
                        <tr>
                            <th className="p-4">User</th>
                            <th className="p-4">Email</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Rank</th>
                            <th className="p-4">Orders</th>
                            <th className="p-4">Joined</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {users.map((user: any) => (
                            <tr key={user.id} className="hover:bg-zinc-800/50 transition">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden">
                                            {user.image ? (
                                                <img src={user.image} alt={user.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <UserIcon size={18} className="text-gray-500" />
                                            )}
                                        </div>
                                        <span className="font-bold text-white">{user.name}</span>
                                    </div>
                                </td>
                                <td className="p-4">{user.email}</td>
                                <td className="p-4">
                                    {user.isAdmin ? (
                                        <span className="bg-red-900/30 text-red-500 border border-red-900/50 text-xs px-2 py-1 rounded font-bold uppercase flex items-center gap-1 w-fit">
                                            <Shield size={12} /> Admin
                                        </span>
                                    ) : (
                                        <span className="bg-zinc-800 text-gray-400 text-xs px-2 py-1 rounded font-bold uppercase">
                                            Member
                                        </span>
                                    )}
                                </td>
                                <td className="p-4">
                                    <span className="flex items-center gap-1 text-sm">
                                        <Crown size={14} className="text-yellow-500" />
                                        {user.rank}
                                    </span>
                                </td>
                                <td className="p-4 text-white font-bold">{user.ordersCount}</td>
                                <td className="p-4 text-sm">{dayjs(user.createdAt).format("DD MMM YYYY")}</td>
                                <td className="p-4 text-right space-x-2">
                                    {/* Toggle Admin Button */}
                                    <button
                                        onClick={() => toggleAdminMutation.mutate({
                                            userId: user.id,
                                            isAdmin: !user.isAdmin
                                        })}
                                        className={`p-2 rounded transition ${user.isAdmin
                                                ? "text-yellow-500 hover:bg-yellow-600 hover:text-white"
                                                : "text-green-500 hover:bg-green-600 hover:text-white"
                                            }`}
                                        title={user.isAdmin ? "Demote to Member" : "Promote to Admin"}
                                    >
                                        {user.isAdmin ? <ShieldOff size={18} /> : <Shield size={18} />}
                                    </button>

                                    {/* Delete Button - only for non-admins */}
                                    {!user.isAdmin && (
                                        <button
                                            onClick={() => {
                                                if (confirm("Kick this user out of the cult?")) {
                                                    deleteMutation.mutate(user.id);
                                                }
                                            }}
                                            className="text-red-500 hover:text-white transition p-2 hover:bg-red-600 rounded"
                                            title="Delete User"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-gray-500">No users found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
            />
        </div>
    );
}
