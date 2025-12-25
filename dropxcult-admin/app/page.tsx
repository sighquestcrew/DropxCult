"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  Loader2, DollarSign, ShoppingBag, Users, Package,
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  AlertTriangle, XCircle, Clock, Award
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart } from "recharts";

const COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#8b5cf6"];

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data } = await axios.get("/api/stats");
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="p-10 text-white flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin h-8 w-8 text-red-600" />
      </div>
    );
  }

  const orderStatusData = stats?.ordersByStatus?.map((s: any, i: number) => ({
    name: s.status,
    value: s.count,
    color: COLORS[i % COLORS.length]
  })) || [];

  return (
    <div className="space-y-8 relative">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-950/10 via-black to-purple-950/10 pointer-events-none" />

      <div className="relative z-10">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-rose-500 bg-clip-text text-transparent">
          Mission Control
        </h1>

        {/* Alert Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 animate-fade-in-up">
          {/* Low Stock Alert */}
          <Link
            href="/products"
            className="bg-gradient-to-br from-amber-600/20 to-orange-600/20 backdrop-blur-sm border border-amber-500/30 p-4 rounded-xl hover:border-amber-500/50 transition-all duration-300 hover-lift group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-400 text-xs font-semibold uppercase tracking-wide">Low Stock Alert</p>
                <p className="text-2xl font-bold text-white mt-1">{stats?.lowStockCount || 0}</p>
                <p className="text-amber-200/70 text-xs mt-1">Products ≤ 5 units</p>
              </div>
              <div className={stats?.lowStockCount > 0 ? "animate-pulse-icon" : ""}>
                <AlertTriangle className="text-amber-400" size={32} />
              </div>
            </div>
          </Link>

          {/* Out of Stock */}
          <Link
            href="/products"
            className="bg-gradient-to-br from-red-600/20 to-rose-600/20 backdrop-blur-sm border border-red-500/30 p-4 rounded-xl hover:border-red-500/50 transition-all duration-300 hover-lift group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-400 text-xs font-semibold uppercase tracking-wide">Out of Stock</p>
                <p className="text-2xl font-bold text-white mt-1">{stats?.outOfStockCount || 0}</p>
                <p className="text-red-200/70 text-xs mt-1">Needs restocking</p>
              </div>
              <div className={stats?.outOfStockCount > 0 ? "animate-pulse-icon" : ""}>
                <XCircle className="text-red-400" size={32} />
              </div>
            </div>
          </Link>

          {/* Pending Pre-orders */}
          <Link
            href="/preorders"
            className="bg-gradient-to-br from-cyan-600/20 to-blue-600/20 backdrop-blur-sm border border-cyan-500/30 p-4 rounded-xl hover:border-cyan-500/50 transition-all duration-300 hover-lift group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-400 text-xs font-semibold uppercase tracking-wide">Pending Pre-Orders</p>
                <p className="text-2xl font-bold text-white mt-1">{stats?.pendingPreorders || 0}</p>
                <p className="text-cyan-200/70 text-xs mt-1">Awaiting processing</p>
              </div>
              <div>
                <Clock className="text-cyan-400" size={32} />
              </div>
            </div>
          </Link>

          {/* Creator Payouts */}
          <Link
            href="/withdrawals"
            className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-sm border border-green-500/30 p-4 rounded-xl hover:border-green-500/50 transition-all duration-300 hover-lift group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-400 text-xs font-semibold uppercase tracking-wide">Creator Payouts</p>
                <p className="text-2xl font-bold text-white mt-1">₹{stats?.totalPayouts?.toLocaleString() || 0}</p>
                <p className="text-green-200/70 text-xs mt-1">
                  {stats?.pendingWithdrawals || 0} pending · {stats?.processedWithdrawals || 0} processed
                </p>
              </div>
              <div>
                <Award className="text-green-400" size={32} />
              </div>
            </div>
          </Link>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          {/* Revenue Card */}
          <Link href="/orders" className="relative group overflow-hidden rounded-xl cursor-pointer block">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div className="relative p-6 hover-lift transition-all duration-300">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-gray-200 text-sm font-bold uppercase tracking-wide">Total Revenue</h3>
                <div className="bg-white/10 p-2 rounded-lg">
                  <DollarSign className="text-emerald-300 animate-pulse-icon" size={20} />
                </div>
              </div>
              <p className="text-3xl font-bold text-white">₹{stats?.totalRevenue?.toLocaleString() || 0}</p>
              <div className="mt-3 flex items-center gap-2 text-sm">
                {stats?.revenueChangePercent >= 0 ? (
                  <span className="flex items-center gap-1 text-emerald-300 font-semibold">
                    <TrendingUp size={14} /> +{stats?.revenueChangePercent}%
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-300 font-semibold">
                    <TrendingDown size={14} /> {stats?.revenueChangePercent}%
                  </span>
                )}
                <span className="text-gray-300">vs last 7 days</span>
              </div>
              <div className="mt-2 pt-3 border-t border-white/10">
                <p className="text-xs text-gray-300">Last 7 days: <span className="font-semibold text-white">₹{stats?.recentRevenue?.toLocaleString() || 0}</span></p>
              </div>
            </div>
          </Link>

          {/* Orders Card */}
          <Link href="/orders" className="relative group overflow-hidden rounded-xl cursor-pointer block">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-cyan-600 to-sky-600 opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div className="relative p-6 hover-lift transition-all duration-300">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-gray-200 text-sm font-bold uppercase tracking-wide">Total Orders</h3>
                <div className="bg-white/10 p-2 rounded-lg">
                  <Package className="text-blue-300 animate-pulse-icon" size={20} />
                </div>
              </div>
              <p className="text-3xl font-bold text-white">{stats?.ordersCount || 0}</p>
              <div className="mt-3 flex items-center gap-2 text-sm">
                {stats?.ordersChangePercent >= 0 ? (
                  <span className="flex items-center gap-1 text-blue-300 font-semibold">
                    <ArrowUpRight size={14} /> +{stats?.ordersChangePercent}%
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-300 font-semibold">
                    <ArrowDownRight size={14} /> {stats?.ordersChangePercent}%
                  </span>
                )}
                <span className="text-gray-300">vs last 7 days</span>
              </div>
              <div className="mt-2 pt-3 border-t border-white/10 flex justify-between text-xs">
                <span className="text-gray-300">Paid: <span className="font-semibold text-green-300">{stats?.paidOrders || 0}</span></span>
                <span className="text-gray-300">Unpaid: <span className="font-semibold text-red-300">{stats?.unpaidOrders || 0}</span></span>
              </div>
            </div>
          </Link>

          {/* Products Card */}
          <Link href="/products" className="relative group overflow-hidden rounded-xl cursor-pointer block">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-fuchsia-600 to-pink-600 opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div className="relative p-6 hover-lift transition-all duration-300">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-gray-200 text-sm font-bold uppercase tracking-wide">Products</h3>
                <div className="bg-white/10 p-2 rounded-lg">
                  <ShoppingBag className="text-purple-300 animate-pulse-icon" size={20} />
                </div>
              </div>
              <p className="text-3xl font-bold text-white">{stats?.productsCount || 0}</p>
              <div className="mt-3 text-sm text-gray-300">
                In inventory
              </div>
              <div className="mt-2 pt-3 border-t border-white/10 flex justify-between text-xs">
                <span className="text-gray-300">Low: <span className="font-semibold text-amber-300">{stats?.lowStockCount || 0}</span></span>
                <span className="text-gray-300">Out: <span className="font-semibold text-red-300">{stats?.outOfStockCount || 0}</span></span>
              </div>
            </div>
          </Link>

          {/* Users Card */}
          <Link href="/users" className="relative group overflow-hidden rounded-xl cursor-pointer block">
            <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-rose-600 to-pink-600 opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div className="relative p-6 hover-lift transition-all duration-300">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-gray-200 text-sm font-bold uppercase tracking-wide">Cult Members</h3>
                <div className="bg-white/10 p-2 rounded-lg">
                  <Users className="text-red-300 animate-pulse-icon" size={20} />
                </div>
              </div>
              <p className="text-3xl font-bold text-white">{stats?.usersCount || 0}</p>
              <div className="mt-3 text-sm text-gray-300">
                Total members
              </div>
              <div className="mt-2 pt-3 border-t border-white/10">
                <p className="text-xs text-gray-300">
                  This month: <span className="font-semibold text-green-300">+{stats?.newUsersThisMonth || 0}</span>
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Revenue Trend Chart */}
          <div className="bg-zinc-900/80 backdrop-blur-sm p-6 rounded-xl border border-zinc-800/50 hover:border-zinc-700/50 transition-all duration-300 hover-lift">
            <h3 className="text-gray-400 text-sm font-bold uppercase mb-4 flex items-center gap-2">
              <div className="w-1 h-4 bg-gradient-to-b from-red-500 to-rose-500 rounded" />
              Revenue Trend (Last 7 Days)
            </h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.revenueTrend || []}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    stroke="#6b7280"
                    fontSize={12}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'short' })}
                  />
                  <YAxis
                    stroke="#6b7280"
                    fontSize={12}
                    tickFormatter={(value) => `₹${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(24, 24, 27, 0.95)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '12px',
                      backdropFilter: 'blur(12px)',
                      boxShadow: '0 0 20px rgba(239, 68, 68, 0.2)'
                    }}
                    labelStyle={{ color: '#9ca3af', fontWeight: 'bold' }}
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#ef4444"
                    strokeWidth={3}
                    fill="url(#colorRevenue)"
                    dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Orders by Status */}
          <div className="bg-zinc-900/80 backdrop-blur-sm p-6 rounded-xl border border-zinc-800/50 hover:border-zinc-700/50 transition-all duration-300 hover-lift">
            <h3 className="text-gray-400 text-sm font-bold uppercase mb-4 flex items-center gap-2">
              <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-cyan-500 rounded" />
              Orders by Status
            </h3>
            <div className="flex items-center gap-4">
              <div className="h-[200px] w-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {orderStatusData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(24, 24, 27, 0.95)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: '12px',
                        backdropFilter: 'blur(12px)'
                      }}
                      formatter={(value: number, name: string) => [value, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {orderStatusData.map((s: any, i: number) => (
                  <div key={i} className="flex items-center justify-between hover:bg-zinc-800/50 p-2 rounded transition">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-gray-400 text-sm capitalize">{s.name}</span>
                    </div>
                    <span className="text-white font-bold">{s.value}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-zinc-800">
                  <div className="flex items-center justify-between text-sm p-2 hover:bg-zinc-800/50 rounded transition">
                    <span className="text-green-400">Paid</span>
                    <span className="font-bold text-white">{stats?.paidOrders || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm p-2 hover:bg-zinc-800/50 rounded transition">
                    <span className="text-red-400">Unpaid</span>
                    <span className="font-bold text-white">{stats?.unpaidOrders || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm p-2 hover:bg-zinc-800/50 rounded transition">
                    <span className="text-blue-400">Delivered</span>
                    <span className="font-bold text-white">{stats?.deliveredOrders || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-zinc-900/80 backdrop-blur-sm p-6 rounded-xl border border-zinc-800/50 hover:border-zinc-700/50 transition-all duration-300 mt-6">
          <h3 className="text-gray-400 text-sm font-bold uppercase mb-4 flex items-center gap-2">
            <div className="w-1 h-4 bg-gradient-to-b from-purple-500 to-pink-500 rounded" />
            Top Selling Products
          </h3>
          {stats?.topProducts?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-xs uppercase text-gray-500 border-b border-zinc-800">
                  <tr>
                    <th className="pb-3">Rank</th>
                    <th className="pb-3">Product</th>
                    <th className="pb-3 text-right">Price</th>
                    <th className="pb-3 text-right">Units Sold</th>
                    <th className="pb-3 text-right">Orders</th>
                    <th className="pb-3 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {stats.topProducts.map((product: any, index: number) => {
                    const revenue = product.price * product.totalSold;
                    const rankBadge = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;

                    return (
                      <tr key={product.id} className="hover:bg-zinc-800/50 transition group">
                        <td className="py-4">
                          <span className="text-2xl">{rankBadge}</span>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            {product.image && (
                              <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-zinc-800 ring-2 ring-transparent group-hover:ring-purple-500/50 transition">
                                <Image src={product.image} alt={product.name} fill className="object-cover" unoptimized />
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="text-white font-medium">{product.name}</span>
                              {product.designId && (
                                <a
                                  href={`http://localhost:3001/product/design-${product.designId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-pink-400 font-mono hover:text-pink-300 hover:underline transition-colors flex items-center gap-1"
                                >
                                  ID: {product.designId.slice(0, 8)}... <span className="opacity-50">↗</span>
                                </a>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-right text-gray-400">₹{product.price}</td>
                        <td className="py-4 text-right">
                          <span className="text-white font-bold bg-gradient-to-r from-purple-600/20 to-pink-600/20 px-3 py-1 rounded-full">
                            {product.totalSold}
                          </span>
                        </td>
                        <td className="py-4 text-right text-gray-400">{product.orderCount}</td>
                        <td className="py-4 text-right">
                          <span className="text-emerald-400 font-bold">₹{revenue.toLocaleString()}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">No sales data yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
