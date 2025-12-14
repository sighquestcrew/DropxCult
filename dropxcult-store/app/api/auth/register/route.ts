import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { logAudit } from "@/lib/audit";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    // 1. Check if user already exists
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // 2. Hash the password (Security)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create User
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    if (user) {
      // 4. Generate Token immediately so they are logged in
      const token = jwt.sign(
        { _id: user.id, isAdmin: user.isAdmin },
        process.env.NEXTAUTH_SECRET!,
        { expiresIn: "30d" }
      );

      // Audit log: new user registration
      await logAudit({
        userId: user.id,
        userEmail: user.email,
        userRole: "user",
        action: "REGISTER",
        entity: "User",
        entityId: user.id,
        details: { name: user.name },
      });

      return NextResponse.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        token,
      });
    } else {
      return NextResponse.json({ error: "Invalid user data" }, { status: 400 });
    }
  } catch (error) {
    console.error("Register Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}