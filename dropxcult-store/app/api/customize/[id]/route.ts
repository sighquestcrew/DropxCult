import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { logAudit } from "@/lib/audit";
import cloudinary, { getPublicIdFromUrl } from "@/lib/cloudinary-server";

// Helper to get User ID from Token
const getUserId = (req: Request) => {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    const token = authHeader.split(" ")[1];
    try {
        const decoded: any = jwt.verify(token, process.env.NEXTAUTH_SECRET!);
        return decoded._id;
    } catch (error) {
        return null;
    }
};

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = getUserId(req);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user email for audit logging
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true }
        });

        const { id } = await params;

        // ✅ SECURITY FIX: Include ownership in query (not after fetch)
        const customReq = await prisma.customRequest.findFirst({
            where: {
                id,
                userId // Only fetch if user owns it
            }
        });

        if (customReq) {
            // 1. Cleanup Cloudinary Images
            const imagesToDelete = [
                customReq.frontImage,
                customReq.backImage,
                customReq.leftSleeveImage,
                customReq.rightSleeveImage
            ].filter(Boolean) as string[];

            if (imagesToDelete.length > 0) {
                try {
                    const publicIds = imagesToDelete
                        .map(url => getPublicIdFromUrl(url))
                        .filter((id): id is string => !!id);

                    if (publicIds.length > 0) {
                        await cloudinary.api.delete_resources(publicIds);
                    }
                } catch (imgError) {
                    console.error("Failed to delete images from Cloudinary:", imgError);
                }
            }

            // User owns this design - safe to delete
            await prisma.customRequest.delete({ where: { id } });

            // Audit log: CustomRequest deleted
            await logAudit({
                userId: userId,
                userEmail: currentUser?.email,
                userRole: "user",
                action: "DELETE",
                entity: "CustomRequest",
                entityId: id,
                details: { type: customReq.type },
            });

            return NextResponse.json({ message: "Design deleted" });
        }

        // ✅ SECURITY FIX: Check ownership for 3D designs too
        const design = await prisma.design.findFirst({
            where: {
                id,
                userId // Only fetch if user owns it
            }
        });

        if (design) {
            // 1. Cleanup Cloudinary Images
            if (design.previewImage) {
                try {
                    const publicId = getPublicIdFromUrl(design.previewImage);
                    if (publicId) {
                        await cloudinary.api.delete_resources([publicId]);
                    }
                } catch (imgError) {
                    console.error("Failed to delete images from Cloudinary:", imgError);
                }
            }

            // User owns this design - safe to delete
            await prisma.design.delete({ where: { id } });

            // Audit log: Design deleted
            await logAudit({
                userId: userId,
                userEmail: currentUser?.email,
                userRole: "user",
                action: "DELETE",
                entity: "Design",
                entityId: id,
                details: { name: design.name },
            });

            return NextResponse.json({ message: "3D Design deleted" });
        }

        return NextResponse.json({ error: "Design not found" }, { status: 404 });
    } catch (error) {
        console.error("Delete Design Error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
