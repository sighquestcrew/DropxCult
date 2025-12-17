import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        rank: true,
        createdAt: true
      }
    });

    return NextResponse.json(
      recentUsers.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        joinDate: user.createdAt.toISOString().split('T')[0],
        rank: user.rank
      }))
    );
  } catch (error) {
    console.error("Recent users error:", error);
    return NextResponse.json({ error: "Failed to fetch recent users" }, { status: 500 });
  }
}
