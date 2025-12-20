import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        let query = searchParams.get("q") || "";

        if (!query || query.length < 2) {
            return NextResponse.json({ users: [] });
        }

        // Strip @ symbol if present
        if (query.startsWith("@")) {
            query = query.slice(1);
        }

        // Search by username or name (case insensitive)
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { username: { contains: query, mode: "insensitive" } },
                    { name: { contains: query, mode: "insensitive" } },
                    // Also search by name transformed to username format (no spaces, lowercase)
                    { name: { contains: query.replace(/-/g, ' '), mode: "insensitive" } }
                ]
            },
            take: 10,
            select: {
                id: true,
                name: true,
                username: true,
                image: true,
                rank: true,
                followersCount: true
            },
            orderBy: { followersCount: "desc" }
        });

        // Generate virtual username for users who don't have one
        const usersWithUsername = users.map(user => ({
            ...user,
            username: user.username || user.name?.toLowerCase().replace(/\s+/g, '')
        }));

        return NextResponse.json({ users: usersWithUsername });
    } catch (error) {
        console.error("Search error:", error);
        return NextResponse.json({ users: [] });
    }
}
