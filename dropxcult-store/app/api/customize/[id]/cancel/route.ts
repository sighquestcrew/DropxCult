import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

const getUser = (req: Request) => {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    const token = authHeader.split(" ")[1];
    try {
        return jwt.verify(token, process.env.NEXTAUTH_SECRET!) as { _id: string };
    } catch (error) {
        return null;
    }
};

// POST: Cancel approval request (reset status to Draft - keeps the design)
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = getUser(req);

        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Try CustomRequest first
        const customReq = await prisma.customRequest.findFirst({
            where: { id: id, userId: user._id }
        });

        if (customReq) {
            await prisma.customRequest.update({
                where: { id },
                data: { status: "Draft" }
            });
            return NextResponse.json({ message: "Request cancelled - design saved as draft" });
        }

        // Try Design (3D)
        const design = await prisma.design.findFirst({
            where: { id: id, userId: user._id }
        });

        if (design) {
            await prisma.design.update({
                where: { id },
                data: { status: "Draft" }
            });
            return NextResponse.json({ message: "Request cancelled - 3D design saved as draft" });
        }

        return NextResponse.json({ error: "Not found" }, { status: 404 });

    } catch (error) {
        console.error("Cancel request error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
