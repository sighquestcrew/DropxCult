import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

const getUser = (req: Request) => {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    const token = authHeader.split(" ")[1];
    try {
        return jwt.verify(token, process.env.NEXTAUTH_SECRET!) as { _id: string; isAdmin: boolean };
    } catch {
        return null;
    }
};

// GET: Fetch all 3D designs (admin) or user's own designs
export async function GET(req: Request) {
    try {
        const user = getUser(req);
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // For admin: show all non-draft designs
        // For users: show their own designs (including drafts)
        const where = user.isAdmin
            ? { status: { not: "Draft" } }  // Hide drafts from admin
            : { userId: user._id };

        const designs = await prisma.design.findMany({
            where,
            include: { user: { select: { name: true, email: true } } },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(designs);
    } catch (error) {
        console.error("Fetch Designs Error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
