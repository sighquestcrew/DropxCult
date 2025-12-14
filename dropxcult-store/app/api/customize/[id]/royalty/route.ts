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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = getUser(req);
    const { accept } = await req.json(); // true = accept deal, false = private only

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Try CustomRequest first
    const customReq = await prisma.customRequest.findFirst({
      where: { id: id, userId: user._id }
    });

    if (customReq) {
      await prisma.customRequest.update({
        where: { id },
        data: {
          status: "Accepted",
          isPublicDesign: accept ? true : false,
          royaltyAccepted: accept ? true : false
        }
      });
      return NextResponse.json({ message: "Offer response saved" });
    }

    // Try Design (3D)
    const design = await prisma.design.findFirst({
      where: { id: id, userId: user._id }
    });

    if (design) {
      console.log("Royalty acceptance - accept value:", accept, "type:", typeof accept);

      const updatedDesign = await prisma.design.update({
        where: { id },
        data: {
          status: "Accepted",
          isPublic: accept === true || accept === "true" ? true : false
        }
      });

      console.log("Updated design isPublic:", updatedDesign.isPublic);
      return NextResponse.json({ message: "3D Design offer response saved", isPublic: updatedDesign.isPublic });
    }

    return NextResponse.json({ error: "Not found" }, { status: 404 });

  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}