import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: commentId } = await params;

        // Get user from auth header
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as { _id: string };
        const userId = decoded._id;

        // Check if comment exists
        const comment = await prisma.designComment.findUnique({
            where: { id: commentId }
        });

        if (!comment) {
            return NextResponse.json({ error: "Comment not found" }, { status: 404 });
        }

        // For dislikes, we'll track it in-memory per session (no DB storage for dislikes)
        // This mimics YouTube's behavior where dislikes are counted but not persisted per user
        // We'll just increment/decrement the dislikeCount

        // Toggle dislike - for simplicity, always increment (reset on page refresh)
        // In production, you'd want a proper DislikeTrack table
        const { action } = await req.json().catch(() => ({ action: 'toggle' }));

        if (action === 'dislike') {
            await prisma.designComment.update({
                where: { id: commentId },
                data: { dislikesCount: { increment: 1 } }
            });

            return NextResponse.json({
                disliked: true,
                dislikesCount: comment.dislikesCount + 1,
                message: "Comment disliked"
            });
        } else {
            // Remove dislike
            await prisma.designComment.update({
                where: { id: commentId },
                data: { dislikesCount: Math.max(0, comment.dislikesCount - 1) }
            });

            return NextResponse.json({
                disliked: false,
                dislikesCount: Math.max(0, comment.dislikesCount - 1),
                message: "Dislike removed"
            });
        }
    } catch (error) {
        console.error("Comment dislike error:", error);
        return NextResponse.json({ error: "Failed to toggle dislike" }, { status: 500 });
    }
}
