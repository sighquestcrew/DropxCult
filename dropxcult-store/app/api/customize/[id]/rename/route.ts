import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const authHeader = req.headers.get("authorization");
        if (!authHeader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.replace("Bearer ", "");
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as { _id: string };

        const { name } = await req.json();

        if (!name || name.trim().length === 0) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        // Verify the design belongs to the user
        const design = await prisma.design.findUnique({
            where: { id },
        });

        if (!design) {
            return NextResponse.json({ error: "Design not found" }, { status: 404 });
        }

        if (design.userId !== decoded._id) {
            return NextResponse.json({ error: "Not authorized" }, { status: 403 });
        }

        // Update the design name
        const updatedDesign = await prisma.design.update({
            where: { id },
            data: { name: name.trim() },
        });

        return NextResponse.json({ success: true, design: updatedDesign });
    } catch (error) {
        console.error("Error renaming design:", error);
        return NextResponse.json({ error: "Failed to rename design" }, { status: 500 });
    }
}
