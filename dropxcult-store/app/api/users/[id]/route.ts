import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: userId } = await params;

        // Get current user if logged in
        let currentUserId: string | null = null;
        const authHeader = req.headers.get("authorization");
        if (authHeader?.startsWith("Bearer ")) {
            try {
                const token = authHeader.split(" ")[1];
                const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as { _id: string };
                currentUserId = decoded._id;
            } catch { }
        }

        // Fetch user profile
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                image: true,
                banner: true,
                bio: true,
                rank: true,
                createdAt: true,
                followersCount: true,
                followingCount: true,
                royaltyEarnings: true,
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Fetch user's public designs (show all public designs, not just Accepted)
        const designs = await prisma.design.findMany({
            where: {
                userId: userId,
                isPublic: true,
                status: "Accepted"
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
            select: {
                id: true,
                name: true,
                previewImage: true,
                tshirtType: true,
                tshirtColor: true,
                likesCount: true,
                commentsCount: true,
                status: true,
                createdAt: true
            }
        });

        // Get actual design count
        const designsCount = await prisma.design.count({
            where: {
                userId: userId,
                isPublic: true
            }
        });

        // Check if current user is following this user
        let isFollowing = false;
        if (currentUserId && currentUserId !== userId) {
            const follow = await prisma.follow.findFirst({
                where: {
                    followerId: currentUserId,
                    followingId: userId
                }
            });
            isFollowing = !!follow;
        }

        // Check if user is a "Creator" (has at least one design with royalty)
        const creatorCheck = await prisma.design.findFirst({
            where: {
                userId: userId,
                hasRoyaltyOffer: true,
                status: "Accepted" // Ensure it's accepted
            },
            select: { id: true }
        });


        return NextResponse.json({
            user: {
                ...user,
                designsCount, // Use actual count
                isFollowing,
                isOwnProfile: currentUserId === userId,
                isCreator: !!creatorCheck
            },
            designs
        });

    } catch (error) {
        console.error("User profile API error:", error);
        return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 });
    }
}
