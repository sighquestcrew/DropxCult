"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Loader2, DollarSign, ShoppingBag, Users, Package, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Clock, CheckCircle, Percent, Zap, AlertTriangle, User, PlusCircle, Palette, Rocket, Megaphone } from "lucide-react";
import Image from "next/image";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#8b5cf6"];

// Mock data for Recent Orders - TODO: Replace with API call
const mockRecentOrders = [
  { id: "ORD-001", customer: "John Doe", amount: 2499, status: "delivered", date: "2025-12-17" },
  { id: "ORD-002", customer: "Sarah Smith", amount: 5999, status: "processing", date: "2025-12-16" },
  { id: "ORD-003", customer: "Mike Johnson", amount: 1799, status: "pending", date: "2025-12-16" },
  { id: "ORD-004", customer: "Emily Brown", amount: 3599, status: "delivered", date: "2025-12-15" },
  { id: "ORD-005", customer: "Alex Wilson", amount: 4299, status: "shipped", date: "2025-12-15" },
];

// Mock data for Recent Users - TODO: Replace with API call
const mockRecentUsers = [
  { id: "USR-001", name: "Priya Sharma", email: "priya@example.com", joinDate: "2025-12-17", rank: "Initiate" },
  { id: "USR-002", name: "Rohan Kumar", email: "rohan@example.com", joinDate: "2025-12-16", rank: "Initiate" },
  { id: "USR-003", name: "Ananya Patel", email: "ananya@example.com", joinDate: "2025-12-15", rank: "Devotee" },
  { id: "USR-004", name: "Vikram Singh", email: "vikram@example.com", joinDate: "2025-12-14", rank: "Initiate" },
  { id: "USR-005", name: "Zara Ahmed", email: "zara@example.com", joinDate: "2025-12-13", rank: "Acolyte" },
];

// Mock data for Order Fulfillment Pipeline - TODO: Replace with API call
const mockOrdersByStage = [
  { stage: "Design Pending", count: 12, stuck: 2 },
  { stage: "Printing", count: 7, stuck: 1 },
  { stage: "Quality Check", count: 3, stuck: 0 },
  { stage: "Shipped", count: 18, stuck: 0 },
  { stage: "Delivered", count: 156, stuck: 0 },
];

// Mock data for Low Stock Products - TODO: Replace with API call
const mockLowStockProducts = [
  { id: "PROD-001", name: "Black Oversized Tee", stock: 5 },
  { id: "PROD-002", name: "White Hoodie", stock: 0 },
  { id: "PROD-003", name: "Red V-Neck", stock: 3 },
];

// Mock data for Revenue Source - TODO: Replace with API call
const mockRevenueBySource = [
  { name: "Custom Upload", value: 45000, color: "#ef4444" },
  { name: "AI Generated", value: 32000, color: "#3b82f6" },
  { name: "Pre-Made", value: 18000, color: "#22c55e" },
];

// Mock data for Top Customers - TODO: Replace with API call
const mockTopCustomers = [
  { id: "CUST-001", name: "Rajesh Kumar", orders: 8, totalSpend: 24999 },
  { id: "CUST-002", name: "Priya Singh", orders: 6, totalSpend: 18499 },
  { id: "CUST-003", name: "Amit Patel", orders: 5, totalSpend: 15299 },
  { id: "CUST-004", name: "Zara Khan", orders: 4, totalSpend: 11999 },
  { id: "CUST-005", name: "Neha Sharma", orders: 3, totalSpend: 8999 },
];

// Mock data for AI Stats - TODO: Replace with API call
const mockAiStats = {
  totalGenerated: 124,
  convertedOrders: 38,
  conversionRate: 30.6
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "delivered":
      return "text-green-500 bg-green-500/10";
    case "shipped":
      return "text-blue-500 bg-blue-500/10";
    case "processing":
      return "text-yellow-500 bg-yellow-500/10";
    case "pending":
      return "text-red-500 bg-red-500/10";
    default:
      return "text-gray-500 bg-gray-500/10";
  }
};

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

  // Calculate KPIs
  const conversionRate = stats?.totalVisitors ? Math.round((stats?.ordersCount / stats?.totalVisitors) * 100 * 10) / 10 : 0;
  const averageOrderValue = stats?.ordersCount ? Math.round(stats?.totalRevenue / stats?.ordersCount) : 0;
  const conversionTrend = stats?.conversionChangePercent || 0;
  const aovTrend = stats?.aovChangePercent || 0;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Mission Control</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        {/* Revenue Card */}
        <div className="lg:col-span-2 bg-zinc-900 p-6 rounded-lg border border-zinc-800">
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
        <div className="lg:col-span-2 bg-zinc-900 p-6 rounded-lg border border-zinc-800">
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
        <div className="lg:col-span-2 bg-zinc-900 p-6 rounded-lg border border-zinc-800">
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
        <div className="lg:col-span-2 bg-zinc-900 p-6 rounded-lg border border-zinc-800">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-gray-400 text-sm font-bold uppercase">Cult Members</h3>
            <Users className="text-red-500" />
          </div>
          <p className="text-3xl font-bold">{stats?.usersCount || 0}</p>
          <div className="mt-2 text-sm text-gray-500">
            +{stats?.newUsersThisMonth || 0} this month
          </div>
        </div>

        {/* Conversion Rate Card */}
        <div className="lg:col-span-2 bg-zinc-900 p-6 rounded-lg border border-zinc-800">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-gray-400 text-sm font-bold uppercase">Conversion Rate</h3>
            <Percent className="text-blue-500" />
          </div>
          <p className="text-3xl font-bold">{conversionRate}%</p>
          <div className="mt-2 flex items-center gap-1 text-sm">
            {conversionTrend >= 0 ? (
              <span className="flex items-center text-green-500">
                <TrendingUp size={14} /> +{conversionTrend}%
              </span>
            ) : (
              <span className="flex items-center text-red-500">
                <TrendingDown size={14} /> {conversionTrend}%
              </span>
            )}
            <span className="text-gray-500">vs last 7 days</span>
          </div>
        </div>

        {/* Average Order Value Card */}
        <div className="lg:col-span-2 bg-zinc-900 p-6 rounded-lg border border-zinc-800">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-gray-400 text-sm font-bold uppercase">Avg Order Value</h3>
            <Zap className="text-yellow-500" />
          </div>
          <p className="text-3xl font-bold">₹{averageOrderValue?.toLocaleString() || 0}</p>
          <div className="mt-2 flex items-center gap-1 text-sm">
            {aovTrend >= 0 ? (
              <span className="flex items-center text-green-500">
                <TrendingUp size={14} /> +{aovTrend}%
              </span>
            ) : (
              <span className="flex items-center text-red-500">
                <TrendingDown size={14} /> {aovTrend}%
              </span>
            )}
            <span className="text-gray-500">vs last 7 days</span>
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

      {/* Order Fulfillment Pipeline */}
      <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
        <h3 className="text-gray-400 text-sm font-bold uppercase mb-6">Order Fulfillment Pipeline</h3>
        <div className="space-y-4">
          {mockOrdersByStage.map((stage, index) => {
            const isStuck = stage.stuck > 0;
            const totalOrders = mockOrdersByStage.reduce((sum, s) => sum + s.count, 0);
            const percentage = (stage.count / totalOrders) * 100;
            
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-300">{stage.stage}</span>
                    <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-gray-400">{stage.count} orders</span>
                    {isStuck && (
                      <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded font-semibold">
                        ⚠️ {stage.stuck} stuck
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{percentage.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all ${isStuck ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded text-sm text-yellow-400">
          <span className="font-semibold">⚡ Alert:</span> 3 orders have been stuck for more than 48 hours. Review Design Pending & Printing stages.
        </div>
      </div>

      {/* Revenue Source Breakdown & AI Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Source Breakdown */}
        <div className="lg:col-span-2 bg-zinc-900 p-6 rounded-lg border border-zinc-800">
          <h3 className="text-gray-400 text-sm font-bold uppercase mb-4">Revenue Source Breakdown</h3>
          <div className="flex items-center gap-6">
            <div className="h-[200px] w-[200px] flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mockRevenueBySource}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {mockRevenueBySource.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                    formatter={(value: number) => `₹${value.toLocaleString()}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-3">
              {mockRevenueBySource.map((source: any, i: number) => {
                const totalRevenue = mockRevenueBySource.reduce((sum, s) => sum + s.value, 0);
                const percentage = ((source.value / totalRevenue) * 100).toFixed(1);
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source.color }} />
                        <span className="text-gray-300 text-sm font-medium">{source.name}</span>
                      </div>
                      <span className="text-white font-bold text-sm">{percentage}%</span>
                    </div>
                    <p className="text-xs text-gray-500">₹{source.value.toLocaleString()}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* AI Design Metrics */}
        <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
          <h3 className="text-gray-400 text-sm font-bold uppercase mb-4">AI Design Analytics</h3>
          <div className="space-y-4">
            <div>
              <p className="text-gray-400 text-xs mb-2">Total Generated</p>
              <p className="text-3xl font-bold text-blue-400">{mockAiStats.totalGenerated}</p>
            </div>
            <div className="h-px bg-zinc-800" />
            <div>
              <p className="text-gray-400 text-xs mb-2">Converted to Orders</p>
              <p className="text-3xl font-bold text-green-400">{mockAiStats.convertedOrders}</p>
            </div>
            <div className="h-px bg-zinc-800" />
            <div>
              <p className="text-gray-400 text-xs mb-2">Conversion Rate</p>
              <p className="text-3xl font-bold text-purple-400">{mockAiStats.conversionRate}%</p>
              <p className="text-xs text-gray-500 mt-2">
                ↑ Great performance! AI designs are converting well.
              </p>
            </div>
          </div>
        </div>
      </div>
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

      {/* Low Stock Alerts */}
      <div className="bg-zinc-900 p-6 rounded-lg border border-red-900/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-400 text-sm font-bold uppercase flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={18} />
            Low Stock Alerts
          </h3>
          <span className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-full font-semibold">
            {mockLowStockProducts.length} critical
          </span>
        </div>
        <div className="space-y-2">
          {mockLowStockProducts.length > 0 ? (
            mockLowStockProducts.map((product) => (
              <a
                key={product.id}
                href={`/products/edit/${product.id}`}
                className="flex items-center justify-between p-3 rounded bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition cursor-pointer"
              >
                <div className="flex-1">
                  <p className="text-white font-medium text-sm">{product.name}</p>
                  <p className="text-red-400 text-xs">Stock: {product.stock} units</p>
                </div>
                <div className="text-right">
                  {product.stock === 0 ? (
                    <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-red-500 text-white">
                      OUT OF STOCK
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-yellow-500/20 text-yellow-400">
                      CRITICAL
                    </span>
                  )}
                </div>
              </a>
            ))
          ) : (
            <div className="text-center text-gray-500 py-4 text-sm">
              ✓ All products have sufficient stock
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders & Recent Users Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <RecentOrdersWidget />

        {/* Recent Users */}
        <RecentUsersWidget />
      </div>

      {/* Admin Quick Actions Bar */}
      <div className="bg-gradient-to-r from-red-600/20 to-purple-600/20 p-6 rounded-lg border border-red-500/30">
        <h3 className="text-gray-400 text-sm font-bold uppercase mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <a href="/products/new" className="flex items-center gap-3 p-4 rounded bg-zinc-800 hover:bg-zinc-700 transition border border-zinc-700 hover:border-blue-500">
            <PlusCircle className="text-blue-400" size={20} />
            <div>
              <p className="text-white font-semibold text-sm">Add Product</p>
              <p className="text-gray-500 text-xs">Create new item</p>
            </div>
          </a>
          <a href="/custom-requests" className="flex items-center gap-3 p-4 rounded bg-zinc-800 hover:bg-zinc-700 transition border border-zinc-700 hover:border-purple-500">
            <Palette className="text-purple-400" size={20} />
            <div>
              <p className="text-white font-semibold text-sm">Review Designs</p>
              <p className="text-gray-500 text-xs">Pending approvals</p>
            </div>
          </a>
          <a href="/orders" className="flex items-center gap-3 p-4 rounded bg-zinc-800 hover:bg-zinc-700 transition border border-zinc-700 hover:border-green-500">
            <Rocket className="text-green-400" size={20} />
            <div>
              <p className="text-white font-semibold text-sm">Process Orders</p>
              <p className="text-gray-500 text-xs">Pending fulfillment</p>
            </div>
          </a>
          <button className="flex items-center gap-3 p-4 rounded bg-zinc-800 hover:bg-zinc-700 transition border border-zinc-700 hover:border-yellow-500">
            <Megaphone className="text-yellow-400" size={20} />
            <div>
              <p className="text-white font-semibold text-sm">Send Promotion</p>
              <p className="text-gray-500 text-xs">Email campaign</p>
            </div>
          </button>
        </div>
      </div>

      {/* Top Customers Section */}
      <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
        <h3 className="text-gray-400 text-sm font-bold uppercase mb-4">Top Customers (VIP)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-xs uppercase text-gray-500 border-b border-zinc-800">
              <tr>
                <th className="pb-3">Customer</th>
                <th className="pb-3 text-right">Orders</th>
                <th className="pb-3 text-right">Total Spend</th>
                <th className="pb-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {mockTopCustomers.map((customer, index) => (
                <tr key={customer.id} className="hover:bg-zinc-800/50 transition">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-purple-500 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{customer.name}</p>
                        <p className="text-gray-500 text-xs">{customer.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-right text-white font-bold">{customer.orders}</td>
                  <td className="py-3 text-right text-green-400 font-bold">₹{customer.totalSpend.toLocaleString()}</td>
                  <td className="py-3 text-center">
                    <button className="text-xs px-3 py-1 rounded bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition">
                      Send Offer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RecentOrdersWidget() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["recent-orders"],
    queryFn: async () => {
      const { data } = await axios.get("/api/orders/recent");
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
        <h3 className="text-gray-400 text-sm font-bold uppercase mb-4">Recent Orders</h3>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-3 rounded bg-zinc-800/50 animate-pulse">
              <div className="h-4 bg-zinc-700 rounded w-1/3 mb-2" />
              <div className="h-3 bg-zinc-700 rounded w-1/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
      <h3 className="text-gray-400 text-sm font-bold uppercase mb-4">Recent Orders</h3>
      <div className="space-y-3">
        {orders.length > 0 ? (
          orders.map((order: any) => (
            <div key={order.id} className="flex items-center justify-between p-3 rounded bg-zinc-800/50 hover:bg-zinc-800 transition">
              <div className="flex-1">
                <p className="text-white font-medium text-sm">{order.id}</p>
                <p className="text-gray-500 text-xs">{order.customer}</p>
              </div>
              <div className="text-right">
                <p className="text-white font-bold text-sm">₹{order.amount.toLocaleString()}</p>
                <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getStatusColor(order.status)} capitalize`}>
                  {order.status}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-4 text-sm">No orders yet</div>
        )}
      </div>
      <button className="w-full mt-4 text-center text-red-500 hover:text-red-400 text-sm font-semibold py-2 hover:bg-zinc-800/50 rounded transition">
        View All Orders →
      </button>
    </div>
  );
}

function RecentUsersWidget() {
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["recent-users"],
    queryFn: async () => {
      const { data } = await axios.get("/api/users/recent");
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
        <h3 className="text-gray-400 text-sm font-bold uppercase mb-4">Recent Users</h3>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-3 rounded bg-zinc-800/50 animate-pulse">
              <div className="h-4 bg-zinc-700 rounded w-1/2 mb-2" />
              <div className="h-3 bg-zinc-700 rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
      <h3 className="text-gray-400 text-sm font-bold uppercase mb-4">Recent Users</h3>
      <div className="space-y-3">
        {users.length > 0 ? (
          users.map((user: any) => (
            <div key={user.id} className="flex items-center justify-between p-3 rounded bg-zinc-800/50 hover:bg-zinc-800 transition">
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{user.name}</p>
                <p className="text-gray-500 text-xs truncate">{user.email}</p>
              </div>
              <div className="text-right ml-2">
                <p className="text-gray-400 text-xs">{new Date(user.joinDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-purple-500/10 text-purple-400 capitalize">
                  {user.rank}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-4 text-sm">No users yet</div>
        )}
      </div>
      <button className="w-full mt-4 text-center text-red-500 hover:text-red-400 text-sm font-semibold py-2 hover:bg-zinc-800/50 rounded transition">
        View All Users →
      </button>
    </div>
  );
}
