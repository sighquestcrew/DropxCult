import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { logAudit } from "@/lib/audit";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Auth
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

        // Find design
        const design = await prisma.design.findUnique({
            where: { id }
        });

        if (!design) {
            return NextResponse.json({ error: "Design not found" }, { status: 404 });
        }

        // Verify ownership
        if (design.userId !== userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Verify status
        if (design.status !== "Accepted") {
            return NextResponse.json({ error: "Only accepted designs can be published" }, { status: 400 });
        }

        // Toggle isPublic
        const updatedDesign = await prisma.design.update({
            where: { id },
            data: { isPublic: true }
        });

        // Audit Log
        await logAudit({
            userId,
            action: "UPDATE",
            entity: "Design",
            entityId: id,
            details: { action: "Published to Community", name: design.name }
        });

        return NextResponse.json(updatedDesign);

    } catch (error) {
        console.error("Publish design error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
