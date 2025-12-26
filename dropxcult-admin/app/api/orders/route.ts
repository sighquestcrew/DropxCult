import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTokenFromRequest, verifyAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  // 🛡️ SECURITY: Defense in Depth (even if middleware misses it)
  const token = await getTokenFromRequest(req);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await verifyAuth(token);
  if (!user || !user.isAdmin) {
    return NextResponse.json({ error: "Forbidden: Admins Only" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);

  // Parse query parameters
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const payment = searchParams.get("payment") || ""; // paid, unpaid
  const delivery = searchParams.get("delivery") || ""; // delivered, processing
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  try {
    // Build where clause
    const where: any = {};

    // Search by order ID
    if (search) {
      where.id = { contains: search, mode: "insensitive" };
    }

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Filter by payment status
    if (payment === "paid") {
      where.isPaid = true;
    } else if (payment === "unpaid") {
      where.isPaid = false;
    }

    // Filter by delivery status
    if (delivery === "delivered") {
      where.isDelivered = true;
    } else if (delivery === "processing") {
      where.isDelivered = false;
    }

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate + "T23:59:59.999Z");
      }
    }

    // Get total count
    const total = await prisma.order.count({ where });

    // Fetch orders with pagination
    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: { name: true, email: true }
        },
        orderItems: {
          include: {
            product: {
              select: {
                slug: true,
                category: true,
                garmentType: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    // Get counts for tabs
    const paidCount = await prisma.order.count({ where: { isPaid: true } });
    const unpaidCount = await prisma.order.count({ where: { isPaid: false } });
    const deliveredCount = await prisma.order.count({ where: { isDelivered: true } });
    const processingCount = await prisma.order.count({ where: { isDelivered: false } });

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      counts: {
        all: await prisma.order.count(),
        paid: paidCount,
        unpaid: unpaidCount,
        delivered: deliveredCount,
        processing: processingCount
      }
    });
  } catch (error) {
    console.error("Orders fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}