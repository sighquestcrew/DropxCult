"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Loader2, DollarSign, ShoppingBag, Users, Package, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import Image from "next/image";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

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
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Mission Control</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Revenue Card */}
        <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-gray-400 text-sm font-bold uppercase">Total Revenue</h3>
            <DollarSign className="text-green-500" />
          </div>
          <p className="text-3xl font-bold">₹{stats?.totalRevenue?.toLocaleString() || 0}</p>
          <div className="mt-2 flex items-center gap-1 text-sm">
            {stats?.revenueChangePercent >= 0 ? (
              <span className="flex items-center text-green-500">
                <TrendingUp size={14} /> +{stats?.revenueChangePercent}%
              </span>
            ) : (
              <span className="flex items-center text-red-500">
                <TrendingDown size={14} /> {stats?.revenueChangePercent}%
              </span>
            )}
            <span className="text-gray-500">vs last 7 days</span>
          </div>
        </div>

        {/* Orders Card */}
        <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-gray-400 text-sm font-bold uppercase">Total Orders</h3>
            <Package className="text-blue-500" />
          </div>
          <p className="text-3xl font-bold">{stats?.ordersCount || 0}</p>
          <div className="mt-2 flex items-center gap-1 text-sm">
            {stats?.ordersChangePercent >= 0 ? (
              <span className="flex items-center text-green-500">
                <ArrowUpRight size={14} /> +{stats?.ordersChangePercent}%
              </span>
            ) : (
              <span className="flex items-center text-red-500">
                <ArrowDownRight size={14} /> {stats?.ordersChangePercent}%
              </span>
            )}
            <span className="text-gray-500">vs last 7 days</span>
          </div>
        </div>

        {/* Products Card */}
        <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-gray-400 text-sm font-bold uppercase">Products</h3>
            <ShoppingBag className="text-purple-500" />
          </div>
          <p className="text-3xl font-bold">{stats?.productsCount || 0}</p>
          <div className="mt-2 text-sm text-gray-500">
            In inventory
          </div>
        </div>

        {/* Users Card */}
        <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-gray-400 text-sm font-bold uppercase">Cult Members</h3>
            <Users className="text-red-500" />
          </div>
          <p className="text-3xl font-bold">{stats?.usersCount || 0}</p>
          <div className="mt-2 text-sm text-gray-500">
            +{stats?.newUsersThisMonth || 0} this month
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
          <h3 className="text-gray-400 text-sm font-bold uppercase mb-4">Revenue Trend (Last 7 Days)</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.revenueTrend || []}>
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
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                  labelStyle={{ color: '#9ca3af' }}
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                  labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={{ fill: '#ef4444', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#ef4444' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders by Status */}
        <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
          <h3 className="text-gray-400 text-sm font-bold uppercase mb-4">Orders by Status</h3>
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
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                    formatter={(value: number, name: string) => [value, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {orderStatusData.map((s: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-gray-400 text-sm capitalize">{s.name}</span>
                  </div>
                  <span className="text-white font-bold">{s.value}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-zinc-800">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-500">Paid</span>
                  <span className="font-bold">{stats?.paidOrders || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-red-500">Unpaid</span>
                  <span className="font-bold">{stats?.unpaidOrders || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-500">Delivered</span>
                  <span className="font-bold">{stats?.deliveredOrders || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
        <h3 className="text-gray-400 text-sm font-bold uppercase mb-4">Top Selling Products</h3>
        {stats?.topProducts?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-xs uppercase text-gray-500 border-b border-zinc-800">
                <tr>
                  <th className="pb-3">Product</th>
                  <th className="pb-3 text-right">Price</th>
                  <th className="pb-3 text-right">Units Sold</th>
                  <th className="pb-3 text-right">Orders</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {stats.topProducts.map((product: any, index: number) => (
                  <tr key={product.id} className="hover:bg-zinc-800/50 transition">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500 font-mono text-sm">#{index + 1}</span>
                        {product.image && (
                          <div className="relative h-10 w-10 rounded overflow-hidden bg-zinc-800">
                            <Image src={product.image} alt={product.name} fill className="object-cover" unoptimized />
                          </div>
                        )}
                        <span className="text-white font-medium">{product.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-right text-gray-400">₹{product.price}</td>
                    <td className="py-3 text-right text-white font-bold">{product.totalSold}</td>
                    <td className="py-3 text-right text-gray-400">{product.orderCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">No sales data yet</div>
        )}
      </div>
    </div>
  );
}
