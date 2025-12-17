import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        totalPrice: true,
        status: true,
        isPaid: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(
      recentOrders.map(order => ({
        id: order.id,
        customer: order.user?.name || 'Unknown Customer',
        email: order.user?.email || '',
        amount: order.totalPrice,
        status: order.status,
        isPaid: order.isPaid,
        date: order.createdAt.toISOString().split('T')[0]
      }))
    );
  } catch (error) {
    console.error("Recent orders error:", error);
    return NextResponse.json({ error: "Failed to fetch recent orders" }, { status: 500 });
  }
}
