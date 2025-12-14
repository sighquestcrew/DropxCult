import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

// Helper to check if user is Admin
const isAdmin = (req: Request) => {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return false;
  const token = authHeader.split(" ")[1];
  try {
    const decoded: any = jwt.verify(token, process.env.NEXTAUTH_SECRET!);
    return decoded.isAdmin === true;
  } catch (error) {
    return false;
  }
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isAdmin(req)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { action, message } = await req.json();

    // Find the request
    const customReq = await prisma.customRequest.findUnique({ where: { id } });
    if (!customReq) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Logic for different Admin Actions
    let status = customReq.status;
    let adminMessage = customReq.adminMessage;

    if (action === "reject") {
      status = "Rejected";
      adminMessage = message || "We cannot fulfill this design at this time.";
    }
    else if (action === "accept") {
      status = "Accepted"; // Ready for checkout
      adminMessage = message || "Design approved!";
    }
    else if (action === "offer_royalty") {
      status = "Royalty_Pending"; // Waiting for user to accept deal
      adminMessage = message || "We love this! Want to make it public for 10% royalty?";
    }

    const updatedReq = await prisma.customRequest.update({
      where: { id },
      data: { status, adminMessage }
    });

    return NextResponse.json({ message: "Status updated", request: updatedReq });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}