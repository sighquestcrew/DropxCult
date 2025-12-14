import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$connect();
    return NextResponse.json({ message: "Database Connected Successfully to DropXCult!" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Database Connection Failed" }, { status: 500 });
  }
}