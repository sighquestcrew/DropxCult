import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Parse query parameters
  const search = searchParams.get("search") || "";
  const role = searchParams.get("role") || ""; // admin, member
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  try {
    // Build where clause
    const where: any = {};

    // Search by name or email
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Filter by role
    if (role === "admin") {
      where.isAdmin = true;
    } else if (role === "member") {
      where.isAdmin = false;
    }

    // Get total count
    const total = await prisma.user.count({ where });

    // Fetch users with pagination
    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        image: true,
        rank: true,
        ordersCount: true,
        createdAt: true,
      }
    });

    // Get counts for tabs
    const adminCount = await prisma.user.count({ where: { isAdmin: true } });
    const memberCount = await prisma.user.count({ where: { isAdmin: false } });

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      counts: {
        all: total,
        admin: adminCount,
        member: memberCount
      }
    });
  } catch (error) {
    console.error("Users fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}