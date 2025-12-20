import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "creators";
    const period = searchParams.get("period") || "alltime";
    const sort = searchParams.get("sort") || "latest";
    const tab = searchParams.get("tab") || "foryou"; // foryou, following, trending

    // Get userId from auth header if available
    let userId: string | null = null;
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as { _id: string };
        userId = decoded._id;
      } catch { }
    }

    // Calculate date range for period filter
    let dateFilter: Date | null = null;
    const now = new Date();
    if (period === "daily") {
      dateFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours
    } else if (period === "weekly") {
      dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === "monthly") {
      dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    let leaderboard: any[] = [];

    if (filter === "creators") {
      // Rank creators by followers + designs approved
      const creators = await prisma.user.findMany({
        where: {
          OR: [
            { designsApproved: { gt: 0 } },
            { followersCount: { gt: 0 } }
          ]
        },
        orderBy: [
          { followersCount: 'desc' },
          { designsApproved: 'desc' }
        ],
        take: 10,
        select: {
          id: true,
          name: true,
          image: true,
          rank: true,
          designsApproved: true,
          followersCount: true,
          royaltyEarnings: true
        }
      });

      // Check follow status for each creator
      if (userId) {
        const followingIds = await prisma.follow.findMany({
          where: {
            followerId: userId,
            followingId: { in: creators.map(c => c.id) }
          },
          select: { followingId: true }
        });
        const followingSet = new Set(followingIds.map(f => f.followingId));
        leaderboard = creators.map(c => ({
          ...c,
          isFollowing: followingSet.has(c.id)
        }));
      } else {
        leaderboard = creators.map(c => ({ ...c, isFollowing: false }));
      }
    } else {
      // Rank by Purchases (Top Buyers)
      leaderboard = await prisma.user.findMany({
        where: { ordersCount: { gt: 0 } },
        orderBy: { ordersCount: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          image: true,
          rank: true,
          ordersCount: true
        }
      });
    }

    // Build ordering for designs
    let orderBy: any = { createdAt: 'desc' }; // latest
    if (sort === "popular") {
      orderBy = { likesCount: 'desc' };
    } else if (sort === "trending") {
      // Trending = recent + engagement
      orderBy = [{ likesCount: 'desc' }, { createdAt: 'desc' }];
    }

    // Get followed user IDs if tab is "following"
    let followingUserIds: string[] = [];
    if (tab === "following" && userId) {
      const follows = await prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true }
      });
      followingUserIds = follows.map(f => f.followingId);
    }

    // Fetch Public 3D Designs (from Design model)
    const designWhere: any = {
      isPublic: true,
      status: "Accepted",
      ...(dateFilter && { createdAt: { gte: dateFilter } }),
      // If "following" tab, only show designs from followed users
      ...(tab === "following" && userId && { userId: { in: followingUserIds } })
    };

    const designs = await prisma.design.findMany({
      where: designWhere,
      orderBy,
      take: 30,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            rank: true,
            followersCount: true
          }
        },
        likes: userId ? {
          where: { userId },
          select: { id: true }
        } : false
      }
    });

    // Also fetch 2D public designs (CustomRequest) for backward compatibility
    const customRequests = await prisma.customRequest.findMany({
      where: {
        isPublicDesign: true,
        ...(dateFilter && { createdAt: { gte: dateFilter } })
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            rank: true
          }
        }
      }
    });

    // Merge and sort feeds
    const feed = [
      ...designs.map((d: any) => ({
        id: d.id,
        type: '3D',
        name: d.name,
        previewImage: d.previewImage,
        tshirtType: d.tshirtType,
        tshirtColor: d.tshirtColor,
        likesCount: d.likesCount,
        commentsCount: d.commentsCount,
        sharesCount: d.sharesCount,
        user: d.user,
        createdAt: d.createdAt,
        is3D: true,
        likedByUser: d.likes && d.likes.length > 0
      })),
      ...customRequests.map(cr => ({
        id: cr.id,
        type: cr.type,
        name: `${cr.color} ${cr.type}`,
        previewImage: cr.frontImage,
        frontImage: cr.frontImage,
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        user: cr.user,
        createdAt: cr.createdAt,
        is3D: false
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ leaderboard, feed });
  } catch (error) {
    console.error("Community API error:", error);
    return NextResponse.json({ error: "Failed to fetch community data" }, { status: 500 });
  }
}