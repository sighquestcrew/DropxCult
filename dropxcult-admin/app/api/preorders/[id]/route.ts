import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params; // Next.js 15: params is now a Promise
        const body = await req.json();

        // Update pre-order
        const preOrder = await prisma.preOrderEntry.update({
            where: { id },
            data: body
        });

        return NextResponse.json({ success: true, preOrder });

    } catch (error: any) {
        console.error("Pre-Order Update Error:", error);
        return NextResponse.json({ error: "Failed to update pre-order" }, { status: 500 });
    }
}
