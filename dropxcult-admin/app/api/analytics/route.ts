import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret";

// Verify admin token
const getAdmin = (req: Request) => {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    const token = authHeader.split(" ")[1];
    try {
        const user = jwt.verify(token, JWT_SECRET) as { id: string; isAdmin: boolean };
        return user.isAdmin ? user : null;
    } catch {
        return null;
    }
};

// GET: Fetch dashboard analytics
export async function GET(req: Request) {
    try {
        const admin = getAdmin(req);
        if (!admin) {
            return NextResponse.json({ error: "Admin only" }, { status: 403 });
        }

        // Date ranges
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        // Total Revenue (all time)
        const totalRevenueResult = await prisma.order.aggregate({
            where: { isPaid: true },
            _sum: { totalPrice: true }
        });
        const totalRevenue = totalRevenueResult._sum.totalPrice || 0;

        // This Month Revenue
        const monthRevenueResult = await prisma.order.aggregate({
            where: {
                isPaid: true,
                paidAt: { gte: thisMonth }
            },
            _sum: { totalPrice: true }
        });
        const monthRevenue = monthRevenueResult._sum.totalPrice || 0;

        // Today's Orders
        const todayOrders = await prisma.order.count({
            where: { createdAt: { gte: today } }
        });

        // Total Orders
        const totalOrders = await prisma.order.count();

        // Pending Orders
        const pendingOrders = await prisma.order.count({
            where: {
                OR: [
                    { isPaid: false },
                    { isDelivered: false }
                ]
            }
        });

        // Total Users
        const totalUsers = await prisma.user.count();

        // New Users This Month
        const newUsersMonth = await prisma.user.count({
            where: { createdAt: { gte: thisMonth } }
        });

        // Total Products
        const totalProducts = await prisma.product.count();

        // Low Stock Products (stock <= 5)
        const lowStockProducts = await prisma.product.count({
            where: { stock: { lte: 5 } }
        });

        // Out of Stock Products
        const outOfStock = await prisma.product.count({
            where: { stock: 0 }
        });

        // Pending Preorders
        const pendingPreorders = await prisma.preorder.count({
            where: { status: "Pending" }
        });

        // Recent Orders (last 5)
        const recentOrders = await prisma.order.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
            include: {
                user: { select: { name: true, email: true } },
                orderItems: true
            }
        });

        // Top Products (by order count)
        const topProducts = await prisma.orderItem.groupBy({
            by: ["productId"],
            _count: { productId: true },
            _sum: { qty: true },
            orderBy: { _count: { productId: "desc" } },
            take: 5
        });

        const topProductsWithDetails = await Promise.all(
            topProducts.map(async (item) => {
                const product = await prisma.product.findUnique({
                    where: { id: item.productId },
                    select: { id: true, name: true, price: true, images: true }
                });
                return {
                    ...product,
                    orderCount: item._count.productId,
                    totalQty: item._sum.qty
                };
            })
        );

        // Daily revenue for last 7 days
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return new Date(date.getFullYear(), date.getMonth(), date.getDate());
        }).reverse();

        const dailyRevenue = await Promise.all(
            last7Days.map(async (day) => {
                const nextDay = new Date(day);
                nextDay.setDate(nextDay.getDate() + 1);

                const result = await prisma.order.aggregate({
                    where: {
                        isPaid: true,
                        paidAt: { gte: day, lt: nextDay }
                    },
                    _sum: { totalPrice: true }
                });

                return {
                    date: day.toISOString().split('T')[0],
                    revenue: result._sum.totalPrice || 0
                };
            })
        );

        return NextResponse.json({
            overview: {
                totalRevenue,
                monthRevenue,
                todayOrders,
                totalOrders,
                pendingOrders,
                totalUsers,
                newUsersMonth,
                totalProducts,
                lowStockProducts,
                outOfStock,
                pendingPreorders
            },
            recentOrders: recentOrders.map(order => ({
                id: order.id,
                user: order.user?.name || "Guest",
                email: order.user?.email || "N/A",
                total: order.totalPrice,
                items: order.orderItems.length,
                isPaid: order.isPaid,
                isDelivered: order.isDelivered,
                createdAt: order.createdAt
            })),
            topProducts: topProductsWithDetails,
            dailyRevenue
        });

    } catch (error: any) {
        console.error("Analytics Error:", error);
        return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
    }
}
