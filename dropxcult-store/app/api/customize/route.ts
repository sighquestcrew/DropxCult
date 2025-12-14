import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { logAudit } from "@/lib/audit";

// Helper to get user from Token
const getUserFromRequest = (req: Request) => {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!);
    return decoded as { _id: string; isAdmin: boolean; email?: string };
  } catch (error) {
    return null;
  }
};

export async function POST(req: Request) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please login." }, { status: 401 });
    }

    const body = await req.json();

    // Map field names from frontend to database schema
    const { leftImage, rightImage, ...rest } = body;

    const newRequest = await prisma.customRequest.create({
      data: {
        userId: user._id,
        leftSleeveImage: leftImage,
        rightSleeveImage: rightImage,
        ...rest,
        status: "Pending"
      }
    });

    // Audit log: CustomRequest created
    await logAudit({
      userId: user._id,
      userEmail: user.email,
      userRole: "user",
      action: "CREATE",
      entity: "CustomRequest",
      entityId: newRequest.id,
      details: { type: rest.type },
    });

    return NextResponse.json(newRequest);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const where = user.isAdmin ? {} : { userId: user._id };

    const requests = await prisma.customRequest.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Also fetch 3D Designs
    const designs = await prisma.design.findMany({
      where: user.isAdmin ? {} : { userId: user._id },
      include: {
        user: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Merge and format
    const formattedDesigns = designs.map((d: any) => ({
      id: d.id,
      type: d.tshirtType === "oversized" ? "Oversized T-Shirt" : "Regular T-Shirt",
      color: d.tshirtColor,
      size: "L", // Default for now
      status: d.status, // Use actual status from DB
      rejectionReason: d.rejectionReason, // Include rejection reason
      isPublic: d.isPublic, // Include public status
      hasRoyaltyOffer: d.hasRoyaltyOffer, // Include royalty offer status
      wasOfferedRoyalty: d.wasOfferedRoyalty, // Track if ever offered royalty
      frontImage: d.previewImage,
      previewImage: d.previewImage,
      createdAt: d.createdAt,
      is3D: true, // Flag for UI
      name: d.name,
      tshirtType: d.tshirtType,
      user: d.user
    }));

    const allItems = [...requests, ...formattedDesigns].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(allItems);
  } catch (error) {
    console.error("Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}