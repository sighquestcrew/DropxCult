import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

// Helper to get user from Token
const getUserFromRequest = (req: Request) => {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!);
    return decoded as { _id: string; isAdmin: boolean };
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
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}