import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

// Toggle follow on a user
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: followingId } = await params;

        // Get user from token
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as { _id: string };
        const followerId = decoded._id;

        // Can't follow yourself
        if (followerId === followingId) {
            return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
        }

        // Check if already following
        const existingFollow = await prisma.follow.findUnique({
            where: {
                followerId_followingId: { followerId, followingId }
            }
        });

        if (existingFollow) {
            // Unfollow
            await prisma.$transaction([
                prisma.follow.delete({
                    where: { id: existingFollow.id }
                }),
                prisma.user.update({
                    where: { id: followerId },
                    data: { followingCount: { decrement: 1 } }
                }),
                prisma.user.update({
                    where: { id: followingId },
                    data: { followersCount: { decrement: 1 } }
                })
            ]);

            const user = await prisma.user.findUnique({
                where: { id: followingId },
                select: { followersCount: true }
            });

            return NextResponse.json({ following: false, followersCount: user?.followersCount || 0 });
        } else {
            // Follow
            await prisma.$transaction([
                prisma.follow.create({
                    data: { followerId, followingId }
                }),
                prisma.user.update({
                    where: { id: followerId },
                    data: { followingCount: { increment: 1 } }
                }),
                prisma.user.update({
                    where: { id: followingId },
                    data: { followersCount: { increment: 1 } }
                })
            ]);

            const user = await prisma.user.findUnique({
                where: { id: followingId },
                select: { followersCount: true }
            });

            return NextResponse.json({ following: true, followersCount: user?.followersCount || 0 });
        }
    } catch (error) {
        console.error("Follow error:", error);
        return NextResponse.json({ error: "Failed to toggle follow" }, { status: 500 });
    }
}

// Check if user is following another user
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: followingId } = await params;

        const authHeader = req.headers.get("authorization");

        const user = await prisma.user.findUnique({
            where: { id: followingId },
            select: { followersCount: true, followingCount: true }
        });

        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({
                following: false,
                followersCount: user?.followersCount || 0,
                followingCount: user?.followingCount || 0
            });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as { _id: string };
        const followerId = decoded._id;

        const existingFollow = await prisma.follow.findUnique({
            where: {
                followerId_followingId: { followerId, followingId }
            }
        });

        return NextResponse.json({
            following: !!existingFollow,
            followersCount: user?.followersCount || 0,
            followingCount: user?.followingCount || 0
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to check follow status" }, { status: 500 });
    }
}
