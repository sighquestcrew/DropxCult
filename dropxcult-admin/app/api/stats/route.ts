import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

import { getTokenFromRequest, verifyAuth } from "@/lib/auth";

export async function GET(req: Request) {
  // 🛡️ SECURITY: Admin Only
  const token = await getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await verifyAuth(token);
  if (!user || !user.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    // Basic counts
    const ordersCount = await prisma.order.count();
    const productsCount = await prisma.product.count();
    const usersCount = await prisma.user.count();

    // Revenue calculations
    const revenueAggregation = await prisma.order.aggregate({
      _sum: { totalPrice: true },
      where: { isPaid: true }
    });
    const totalRevenue = revenueAggregation._sum.totalPrice || 0;

    // Get date ranges
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Revenue trend (last 7 days)
    const recentOrders = await prisma.order.findMany({
      where: {
        isPaid: true,
        createdAt: { gte: sevenDaysAgo }
      },
      select: {
        totalPrice: true,
        createdAt: true
      }
    });

    // Group by day
    const revenueTrend: { date: string; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      const dayRevenue = recentOrders
        .filter(o => o.createdAt.toISOString().split("T")[0] === dateStr)
        .reduce((sum, o) => sum + o.totalPrice, 0);
      revenueTrend.push({ date: dateStr, revenue: dayRevenue });
    }

    // Previous period comparison (7-14 days ago)
    const previousPeriodOrders = await prisma.order.aggregate({
      _sum: { totalPrice: true },
      _count: true,
      where: {
        isPaid: true,
        createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo }
      }
    });

    const currentPeriodOrders = await prisma.order.aggregate({
      _sum: { totalPrice: true },
      _count: true,
      where: {
        isPaid: true,
        createdAt: { gte: sevenDaysAgo }
      }
    });

    const previousRevenue = previousPeriodOrders._sum.totalPrice || 0;
    const currentRevenue = currentPeriodOrders._sum.totalPrice || 0;
    const revenueChangePercent = previousRevenue > 0
      ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100)
      : 100;

    const previousOrdersCount = previousPeriodOrders._count || 0;
    const currentOrdersCount = currentPeriodOrders._count || 0;
    const ordersChangePercent = previousOrdersCount > 0
      ? Math.round(((currentOrdersCount - previousOrdersCount) / previousOrdersCount) * 100)
      : 100;

    // Orders by status
    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      _count: true
    });

    // Orders by payment status
    const paidOrders = await prisma.order.count({ where: { isPaid: true } });
    const unpaidOrders = await prisma.order.count({ where: { isPaid: false } });
    const deliveredOrders = await prisma.order.count({ where: { isDelivered: true } });

    // Top 5 selling products (by order items from PAID orders only)
    // Use name from OrderItem directly as it stores the actual product name ordered
    const paidOrderIds = (await prisma.order.findMany({
      where: { isPaid: true },
      select: { id: true }
    })).map(o => o.id);

    // Get all order items from paid orders
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId: { in: paidOrderIds } },
      select: { name: true, qty: true, price: true, image: true, designId: true }
    });

    // Group by product name AND designId to distinguish specific custom designs
    // Group by product name AND designId to distinguish specific custom designs
    // Group by product Name + Image to merge identical designs even if designId is missing
    const productSales: Record<string, { id: string; name: string; designId?: string | null; qty: number; orderCount: number; price: number; image: string }> = {};

    orderItems.forEach(item => {
      // Create a unique key using Name + Image URL
      // This merges items that look the same (same image), solving the issue where some have designId and others don't
      const uniqueKey = `${item.name}-${item.image}`;

      if (!productSales[uniqueKey]) {
        productSales[uniqueKey] = {
          id: uniqueKey,
          name: item.name,
          designId: item.designId, // Initialize with current designId
          qty: 0,
          orderCount: 0,
          price: item.price,
          image: item.image
        };
      }

      // If we encounter a designId and the existing entry doesn't have one, update it
      if (item.designId && !productSales[uniqueKey].designId) {
        productSales[uniqueKey].designId = item.designId;
      }

      productSales[uniqueKey].qty += item.qty;
      productSales[uniqueKey].orderCount += 1;
    });

    // Sort by quantity sold and take top 5
    const topProductsWithDetails = Object.values(productSales)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        name: p.name,
        designId: p.designId, // Pass design Id to frontend
        image: p.image,
        price: p.price,
        totalSold: p.qty,
        orderCount: p.orderCount
      }));

    // New users this month
    const newUsersThisMonth = await prisma.user.count({
      where: { createdAt: { gte: thirtyDaysAgo } }
    });

    return NextResponse.json({
      // Basic stats
      ordersCount,
      productsCount,
      usersCount,
      totalRevenue,

      // Trends
      revenueTrend,
      revenueChangePercent,
      ordersChangePercent,

      // Breakdowns
      ordersByStatus: ordersByStatus.map(s => ({ status: s.status, count: s._count })),
      paidOrders,
      unpaidOrders,
      deliveredOrders,

      // Top products
      topProducts: topProductsWithDetails,

      // Recent activity
      newUsersThisMonth,
      recentOrdersCount: currentOrdersCount,
      recentRevenue: currentRevenue,

      // Inventory Alerts
      lowStockCount: await prisma.product.count({ where: { stock: { gt: 0, lte: 5 } } }),
      outOfStockCount: await prisma.product.count({ where: { stock: 0 } }),
      pendingPreorders: await prisma.preorder.count({ where: { status: "Pending" } }),

      // Creator Payouts
      totalPayouts: (await prisma.withdrawalRequest.aggregate({
        _sum: { amount: true },
        where: { status: "processed" }
      }))._sum.amount || 0,
      pendingWithdrawals: await prisma.withdrawalRequest.count({ where: { status: "pending" } }),
      processedWithdrawals: await prisma.withdrawalRequest.count({ where: { status: "processed" } }),
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}