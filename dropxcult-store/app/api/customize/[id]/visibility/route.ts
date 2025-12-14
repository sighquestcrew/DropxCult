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

// POST: Toggle public/private status for a design
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = getUser(req);

        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Find the design and verify ownership
        const design = await prisma.design.findFirst({
            where: { id: id, userId: user._id }
        });

        if (!design) {
            return NextResponse.json({ error: "Design not found" }, { status: 404 });
        }

        // Only allow toggling for accepted designs
        if (design.status !== "Accepted") {
            return NextResponse.json({ error: "Only approved designs can be made public" }, { status: 400 });
        }

        // Toggle the isPublic status
        // If going from public to private, user loses royalty status and needs re-approval
        const goingPrivate = design.isPublic === true;

        const updateData: any = { isPublic: !design.isPublic };

        if (goingPrivate && design.hasRoyaltyOffer) {
            // User is making it private, loses royalty and needs re-approval
            updateData.hasRoyaltyOffer = false;
        }

        const updatedDesign = await prisma.design.update({
            where: { id },
            data: updateData
        });

        const message = goingPrivate && design.hasRoyaltyOffer
            ? "Design is now private. Royalty lost - re-submit for approval to get royalty again."
            : updatedDesign.isPublic
                ? "Design is now public"
                : "Design is now private";

        return NextResponse.json({
            message,
            isPublic: updatedDesign.isPublic
        });

    } catch (error) {
        console.error("Toggle visibility error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
