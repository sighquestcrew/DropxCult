import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { logAudit } from "@/lib/audit";
import { sendDesignStatusEmail } from "@/lib/email";

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

// POST: Admin action on 3D design (accept/reject)
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = getUser(req);
        if (!user || !user.isAdmin) {
            return NextResponse.json({ error: "Admin only" }, { status: 403 });
        }

        // Get admin email for audit logging
        const adminUser = await prisma.user.findUnique({
            where: { id: user._id },
            select: { email: true }
        });

        const { id } = await params;
        const { action, reason } = await req.json();

        let newStatus: string;
        let updateData: { status: string; rejectionReason?: string | null; hasRoyaltyOffer?: boolean; wasOfferedRoyalty?: boolean } = { status: "" };

        switch (action) {
            case "accept":
                newStatus = "Accepted";
                updateData = { status: newStatus, rejectionReason: null };
                break;
            case "reject":
                newStatus = "Rejected";
                updateData = { status: newStatus, rejectionReason: reason || "No reason provided" };
                break;
            case "offer_royalty":
                newStatus = "Royalty_Pending";
                updateData = { status: newStatus, hasRoyaltyOffer: true, wasOfferedRoyalty: true };
                break;
            default:
                return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        const design = await prisma.design.update({
            where: { id },
            data: updateData,
            include: {
                user: {
                    select: { name: true, email: true }
                }
            }
        });

        // Send email notification for accept/reject
        if ((action === "accept" || action === "reject") && design.user?.email) {
            await sendDesignStatusEmail({
                designName: design.name,
                designerName: design.user.name || 'Designer',
                designerEmail: design.user.email,
                status: action === "accept" ? "Accepted" : "Rejected",
                message: reason || undefined,
            });
        }

        // Audit log: Admin design action
        const auditAction = action === "accept" ? "APPROVE" : action === "reject" ? "REJECT" : "STATUS_CHANGE";
        await logAudit({
            userId: user._id,
            userEmail: adminUser?.email,
            userRole: "admin",
            action: auditAction,
            entity: "Design",
            entityId: id,
            details: { action, newStatus, reason: reason || null },
        });

        return NextResponse.json({ message: "Status updated" });
    } catch (error) {
        console.error("Design action error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}

