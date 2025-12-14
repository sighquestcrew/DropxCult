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

export async function POST(req: Request) {
  try {
    const user = getUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { designId } = await req.json();

    const design = await prisma.customRequest.findUnique({
      where: { id: designId },
      include: { likes: true }
    });

    if (!design) return NextResponse.json({ error: "Design not found" }, { status: 404 });

    const isLiked = design.likes.some((u: any) => u.id === user._id);

    if (!isLiked) {
      // Not liked yet -> Add Like
      await prisma.customRequest.update({
        where: { id: designId },
        data: {
          likes: {
            connect: { id: user._id }
          }
        }
      });
    } else {
      // Already liked -> Remove Like (Unlike)
      await prisma.customRequest.update({
        where: { id: designId },
        data: {
          likes: {
            disconnect: { id: user._id }
          }
        }
      });
    }

    // Fetch updated likes
    const updatedDesign = await prisma.customRequest.findUnique({
      where: { id: designId },
      include: { likes: true }
    });

    return NextResponse.json({
      message: !isLiked ? "Liked" : "Unliked",
      likes: updatedDesign?.likes || []
    });

  } catch (error) {
    console.error("Like error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}