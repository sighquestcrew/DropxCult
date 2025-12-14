import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// PATCH - Update user role (promote/demote admin)
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const body = await req.json();
        const { isAdmin } = body;

        if (typeof isAdmin !== "boolean") {
            return NextResponse.json({ error: "isAdmin must be a boolean" }, { status: 400 });
        }

        const user = await prisma.user.update({
            where: { id },
            data: { isAdmin }
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error("User role update error:", error);
        return NextResponse.json({ error: "Failed to update user role" }, { status: 500 });
    }
}
