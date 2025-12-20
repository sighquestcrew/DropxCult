import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: targetUserId } = await params;

        // Require authentication
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        let currentUserId: string;
        try {
            const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as { _id: string };
            currentUserId = decoded._id;
        } catch {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        // Can't follow yourself
        if (currentUserId === targetUserId) {
            return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
        }

        // Check if already following
        const existingFollow = await prisma.follow.findFirst({
            where: {
                followerId: currentUserId,
                followingId: targetUserId
            }
        });

        if (existingFollow) {
            // Unfollow
            await prisma.follow.delete({
                where: { id: existingFollow.id }
            });

            // Update follower counts
            await prisma.user.update({
                where: { id: targetUserId },
                data: { followersCount: { decrement: 1 } }
            });
            await prisma.user.update({
                where: { id: currentUserId },
                data: { followingCount: { decrement: 1 } }
            });

            return NextResponse.json({ followed: false, message: "Unfollowed" });
        } else {
            // Follow
            await prisma.follow.create({
                data: {
                    followerId: currentUserId,
                    followingId: targetUserId
                }
            });

            // Update follower counts
            await prisma.user.update({
                where: { id: targetUserId },
                data: { followersCount: { increment: 1 } }
            });
            await prisma.user.update({
                where: { id: currentUserId },
                data: { followingCount: { increment: 1 } }
            });

            return NextResponse.json({ followed: true, message: "Followed" });
        }
    } catch (error) {
        console.error("Follow API error:", error);
        return NextResponse.json({ error: "Failed to follow/unfollow" }, { status: 500 });
    }
}
