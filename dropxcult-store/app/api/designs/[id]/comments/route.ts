import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

// Get comments for a design (threaded structure)
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: designId } = await params;
        const { searchParams } = new URL(req.url);
        const sort = searchParams.get("sort") || "top"; // 'top' or 'newest'

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

        // Build order by clause
        const orderBy = sort === "newest"
            ? { createdAt: "desc" as const }
            : [{ likesCount: "desc" as const }, { createdAt: "desc" as const }];

        // Only fetch top-level comments (no parentId), with their replies nested
        const comments = await prisma.designComment.findMany({
            where: {
                designId,
                parentId: null  // Only top-level comments
            },
            orderBy,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                        rank: true
                    }
                },
                likes: userId ? {
                    where: { userId },
                    select: { id: true }
                } : false,
                replies: {
                    orderBy: { createdAt: "asc" },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                image: true,
                                rank: true
                            }
                        },
                        likes: userId ? {
                            where: { userId },
                            select: { id: true }
                        } : false
                    }
                }
            }
        });

        // Transform to include likedByUser flags
        const transformedComments = comments.map(comment => ({
            ...comment,
            likedByUser: Array.isArray(comment.likes) && comment.likes.length > 0,
            replies: comment.replies.map(reply => ({
                ...reply,
                likedByUser: Array.isArray((reply as any).likes) && (reply as any).likes.length > 0
            }))
        }));

        return NextResponse.json(transformedComments);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
    }
}

// Add a comment to a design (supports replies via parentId)
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: designId } = await params;
        const { content, parentId } = await req.json();

        if (!content?.trim()) {
            return NextResponse.json({ error: "Comment content required" }, { status: 400 });
        }

        // Get user from token
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as { _id: string };
        const userId = decoded._id;

        // Create comment (with optional parentId for replies)
        const [comment] = await prisma.$transaction([
            prisma.designComment.create({
                data: {
                    userId,
                    designId,
                    content: content.trim(),
                    parentId: parentId || null  // Link to parent if it's a reply
                },
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
            }),
            prisma.design.update({
                where: { id: designId },
                data: { commentsCount: { increment: 1 } }
            })
        ]);

        return NextResponse.json(comment, { status: 201 });
    } catch (error) {
        console.error("Comment error:", error);
        return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
    }
}

// Delete a comment
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { searchParams } = new URL(req.url);
        const commentId = searchParams.get("commentId");
        const { id: designId } = await params;

        if (!commentId) {
            return NextResponse.json({ error: "Comment ID required" }, { status: 400 });
        }

        // Get user from token
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as { _id: string };
        const userId = decoded._id;

        // Verify comment ownership
        const comment = await prisma.designComment.findUnique({
            where: { id: commentId }
        });

        if (!comment || comment.userId !== userId) {
            return NextResponse.json({ error: "Not authorized" }, { status: 403 });
        }

        // Delete comment and decrement count
        await prisma.$transaction([
            prisma.designComment.delete({
                where: { id: commentId }
            }),
            prisma.design.update({
                where: { id: designId },
                data: { commentsCount: { decrement: 1 } }
            })
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
    }
}
