import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Track share count
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: designId } = await params;

        await prisma.design.update({
            where: { id: designId },
            data: { sharesCount: { increment: 1 } }
        });

        const design = await prisma.design.findUnique({
            where: { id: designId },
            select: { sharesCount: true }
        });

        return NextResponse.json({ sharesCount: design?.sharesCount || 0 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to track share" }, { status: 500 });
    }
}
