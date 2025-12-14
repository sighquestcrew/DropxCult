import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // REPLACE THIS EMAIL with the one you just registered with!
    const myEmail = "admin@dropxcult.com";

    const user = await prisma.user.findUnique({ where: { email: myEmail } });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.user.update({
      where: { email: myEmail },
      data: { isAdmin: true }
    });

    return NextResponse.json({ message: `Success! ${user.name} is now an Admin.` });
  } catch (error) {
    return NextResponse.json({ error: "Error promoting user" }, { status: 500 });
  }
}