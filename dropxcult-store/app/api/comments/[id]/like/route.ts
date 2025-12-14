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

        // Check if user already liked this comment
        const existingLike = await prisma.commentLike.findUnique({
            where: {
                userId_commentId: { userId, commentId }
            }
        });

        if (existingLike) {
            // Unlike - remove the like
            await prisma.commentLike.delete({
                where: { id: existingLike.id }
            });

            // Decrement likesCount
            await prisma.designComment.update({
                where: { id: commentId },
                data: { likesCount: { decrement: 1 } }
            });

            return NextResponse.json({
                liked: false,
                likesCount: comment.likesCount - 1,
                message: "Comment unliked"
            });
        } else {
            // Like - create new like
            await prisma.commentLike.create({
                data: { userId, commentId }
            });

            // Increment likesCount
            await prisma.designComment.update({
                where: { id: commentId },
                data: { likesCount: { increment: 1 } }
            });

            return NextResponse.json({
                liked: true,
                likesCount: comment.likesCount + 1,
                message: "Comment liked"
            });
        }
    } catch (error) {
        console.error("Comment like error:", error);
        return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 });
    }
}
