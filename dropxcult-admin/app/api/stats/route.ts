import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
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

    // Top 5 selling products (by order items)
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { qty: true },
      _count: true,
      orderBy: { _sum: { qty: 'desc' } },
      take: 5
    });

    // Get product details for top products
    const productIds = topProducts.map(p => p.productId);
    const productDetails = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, price: true, images: true }
    });

    const topProductsWithDetails = topProducts.map(tp => {
      const product = productDetails.find(p => p.id === tp.productId);
      return {
        id: tp.productId,
        name: product?.name || "Unknown",
        image: product?.images[0] || "",
        price: product?.price || 0,
        totalSold: tp._sum.qty || 0,
        orderCount: tp._count
      };
    });

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
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}