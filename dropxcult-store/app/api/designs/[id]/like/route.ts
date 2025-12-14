import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

// Toggle like on a design
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: designId } = await params;

        // Get user from token
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as { _id: string };
        const userId = decoded._id;

        // Check if already liked
        const existingLike = await prisma.designLike.findUnique({
            where: {
                userId_designId: { userId, designId }
            }
        });

        if (existingLike) {
            // Unlike - remove like and decrement count
            await prisma.$transaction([
                prisma.designLike.delete({
                    where: { id: existingLike.id }
                }),
                prisma.design.update({
                    where: { id: designId },
                    data: { likesCount: { decrement: 1 } }
                })
            ]);

            const design = await prisma.design.findUnique({
                where: { id: designId },
                select: { likesCount: true }
            });

            return NextResponse.json({ liked: false, likesCount: design?.likesCount || 0 });
        } else {
            // Like - add like and increment count
            await prisma.$transaction([
                prisma.designLike.create({
                    data: { userId, designId }
                }),
                prisma.design.update({
                    where: { id: designId },
                    data: { likesCount: { increment: 1 } }
                })
            ]);

            const design = await prisma.design.findUnique({
                where: { id: designId },
                select: { likesCount: true }
            });

            return NextResponse.json({ liked: true, likesCount: design?.likesCount || 0 });
        }
    } catch (error) {
        console.error("Like error:", error);
        return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 });
    }
}

// Check if user has liked a design
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: designId } = await params;

        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            // Return just the count if not authenticated
            const design = await prisma.design.findUnique({
                where: { id: designId },
                select: { likesCount: true }
            });
            return NextResponse.json({ liked: false, likesCount: design?.likesCount || 0 });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as { _id: string };
        const userId = decoded._id;

        const existingLike = await prisma.designLike.findUnique({
            where: {
                userId_designId: { userId, designId }
            }
        });

        const design = await prisma.design.findUnique({
            where: { id: designId },
            select: { likesCount: true }
        });

        return NextResponse.json({
            liked: !!existingLike,
            likesCount: design?.likesCount || 0
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to check like status" }, { status: 500 });
    }
}
