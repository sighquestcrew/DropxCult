import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

// Toggle public visibility of a design
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

        // Get the design
        const design = await prisma.design.findUnique({
            where: { id: designId }
        });

        if (!design) {
            return NextResponse.json({ error: "Design not found" }, { status: 404 });
        }

        // Check ownership
        if (design.userId !== userId) {
            return NextResponse.json({ error: "Not authorized" }, { status: 403 });
        }

        // Only accepted designs can be made public
        if (design.status !== "Accepted") {
            return NextResponse.json({
                error: "Only approved designs can be posted to community"
            }, { status: 400 });
        }

        // Toggle public status
        const updatedDesign = await prisma.design.update({
            where: { id: designId },
            data: { isPublic: !design.isPublic }
        });

        return NextResponse.json({
            isPublic: updatedDesign.isPublic,
            message: updatedDesign.isPublic ? "Posted to community!" : "Removed from community"
        });
    } catch (error) {
        console.error("Visibility toggle error:", error);
        return NextResponse.json({ error: "Failed to update visibility" }, { status: 500 });
    }
}
