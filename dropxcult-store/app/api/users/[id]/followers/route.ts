import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: userId } = await params;
        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type") || "followers"; // "followers" or "following"

        if (type === "followers") {
            // Get users who follow this user
            const followers = await prisma.follow.findMany({
                where: { followingId: userId },
                include: {
                    follower: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                            image: true,
                            rank: true,
                            bio: true,
                            followersCount: true
                        }
                    }
                },
                orderBy: { createdAt: "desc" }
            });

            return NextResponse.json({
                type: "followers",
                users: followers.map(f => f.follower)
            });
        } else {
            // Get users this user follows
            const following = await prisma.follow.findMany({
                where: { followerId: userId },
                include: {
                    following: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                            image: true,
                            rank: true,
                            bio: true,
                            followersCount: true
                        }
                    }
                },
                orderBy: { createdAt: "desc" }
            });

            return NextResponse.json({
                type: "following",
                users: following.map(f => f.following)
            });
        }
    } catch (error) {
        console.error("Followers API error:", error);
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}
