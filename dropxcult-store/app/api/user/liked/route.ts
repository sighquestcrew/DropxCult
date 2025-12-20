import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function GET(req: Request) {
    try {
        // Require authentication
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        let userId: string;
        try {
            const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as { _id: string };
            userId = decoded._id;
        } catch {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        // Get all likes by this user on 3D designs
        const likes = await prisma.designLike.findMany({
            where: { userId },
            include: {
                design: {
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
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Filter out nulls and map to design data
        const likedDesigns = likes
            .filter(like => like.design !== null)
            .map(like => ({
                id: like.design.id,
                name: like.design.name,
                previewImage: like.design.previewImage,
                tshirtType: like.design.tshirtType,
                tshirtColor: like.design.tshirtColor,
                likesCount: like.design.likesCount,
                createdAt: like.design.createdAt,
                user: like.design.user,
                likedAt: like.createdAt
            }));

        return NextResponse.json(likedDesigns);
    } catch (error) {
        console.error("Liked designs error:", error);
        return NextResponse.json({ error: "Failed to fetch liked designs" }, { status: 500 });
    }
}
