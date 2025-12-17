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

    // Calculate KPIs
    // Total visitors estimate (we'll use users for now - you may want unique sessions)
    const totalVisitors = usersCount;
    const conversionRate = totalVisitors > 0 ? (ordersCount / totalVisitors) * 100 : 0;
    const averageOrderValue = ordersCount > 0 ? totalRevenue / ordersCount : 0;

    // Conversion rate trend
    const previousPeriodVisitors = await prisma.user.count({
      where: { createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } }
    });
    const previousConversionRate = previousPeriodVisitors > 0 
      ? (previousOrdersCount / previousPeriodVisitors) * 100 
      : 0;
    const conversionChangePercent = previousConversionRate > 0
      ? Math.round(((conversionRate - previousConversionRate) / previousConversionRate) * 100)
      : 0;

    // AOV trend
    const previousAOV = previousOrdersCount > 0 ? previousRevenue / previousOrdersCount : 0;
    const aovChangePercent = previousAOV > 0
      ? Math.round(((averageOrderValue - previousAOV) / previousAOV) * 100)
      : 0;

    // Orders by stage (you'll need to adjust based on your order status schema)
    const ordersByStage = await prisma.order.groupBy({
      by: ['status'],
      _count: true
    });

    // Low stock products (threshold: 10 units)
    const lowStockThreshold = 10;
    const lowStockProducts = await prisma.product.findMany({
      where: { stock: { lte: lowStockThreshold } },
      select: { id: true, name: true, stock: true },
      take: 5,
      orderBy: { stock: 'asc' }
    });

    // Revenue by source (you'll need to add a 'source' field to Order model)
    // For now, we'll return static data - update when your schema supports it
    const revenueBySource = [
      { name: "Custom Upload", value: Math.round(totalRevenue * 0.45), percentage: 45 },
      { name: "AI Generated", value: Math.round(totalRevenue * 0.35), percentage: 35 },
      { name: "Pre-Made", value: Math.round(totalRevenue * 0.20), percentage: 20 }
    ];

    // Top customers
    const topCustomers = await prisma.order.groupBy({
      by: ['userId'],
      _sum: { totalPrice: true },
      _count: true,
      orderBy: { _sum: { totalPrice: 'desc' } },
      take: 5,
      where: { isPaid: true }
    });

    const customerIds = topCustomers.map(c => c.userId).filter((id): id is string => id !== null);
    const customerDetails = await prisma.user.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, name: true, email: true }
    });

    const topCustomersWithDetails = topCustomers
      .map(tc => {
        const customer = customerDetails.find(c => c.id === tc.userId);
        return {
          id: tc.userId,
          name: customer?.name || "Unknown",
          email: customer?.email || "",
          orders: tc._count,
          totalSpend: tc._sum.totalPrice || 0
        };
      })
      .filter(c => c.id); // Filter out null user IDs

    // AI stats (you'll need to track this in your design/order model)
    // For now, returning estimated data
    const aiDesignCount = Math.floor(ordersCount * 0.35); // Assume 35% are AI-generated
    const aiConvertedCount = Math.floor(aiDesignCount * 0.4);
    const aiStats = {
      totalGenerated: aiDesignCount,
      convertedOrders: aiConvertedCount,
      conversionRate: aiDesignCount > 0 ? (aiConvertedCount / aiDesignCount) * 100 : 0
    };

    return NextResponse.json({
      // Basic stats
      ordersCount,
      productsCount,
      usersCount,
      totalRevenue,

      // KPIs
      conversionRate: Number(conversionRate.toFixed(1)),
      averageOrderValue: Number(averageOrderValue.toFixed(0)),
      totalVisitors,
      conversionChangePercent,
      aovChangePercent,

      // Trends
      revenueTrend,
      revenueChangePercent,
      ordersChangePercent,

      // Breakdowns
      ordersByStatus: ordersByStatus.map(s => ({ status: s.status, count: s._count })),
      ordersByStage,
      paidOrders,
      unpaidOrders,
      deliveredOrders,

      // Product insights
      topProducts: topProductsWithDetails,
      lowStockProducts: lowStockProducts.map(p => ({
        id: p.id,
        name: p.name,
        stock: p.stock
      })),

      // Revenue insights
      revenueBySource,

      // Customer insights
      topCustomers: topCustomersWithDetails,

      // AI metrics
      aiStats,

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