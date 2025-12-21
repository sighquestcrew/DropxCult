import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret";

// Helper to get user from Token
const getUserFromRequest = (req: Request) => {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded as { id: string; isAdmin: boolean };
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
        userId: user.id,
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

    const where = user.isAdmin ? {} : { userId: user.id };

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