import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
// import { logAudit } from "@/lib/audit"; // Attempting to use existing audit lib if possible, otherwise skip or mock

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
        }

        // 1. Find User
        const user = await prisma.user.findUnique({ where: { email } });

        // 2. Validate Password
        // Prevent timing attacks
        const passwordHash = user?.password || await bcrypt.hash("dummy", 10);
        const passwordMatch = await bcrypt.compare(password, passwordHash);

        if (user && passwordMatch) {
            // Validate Admin Status (Double Check)
            if (!user.isAdmin) {
                return NextResponse.json({ error: "Access Denied: Admins Only" }, { status: 403 });
            }

            // 3. Issue Token
            // Note: Using same secret as store to ensure compatibility if tokens are shared/decoded elsewhere, 
            // but essentially this is now a standalone token for admin app session.
            const token = jwt.sign(
                { _id: user.id, isAdmin: user.isAdmin, name: user.name, email: user.email },
                process.env.NEXTAUTH_SECRET!,
                { expiresIn: "24h" }
            );

            // Try to log audit if the function exists and schema matches
            try {
                // Checking if we can import logAudit dynamically or just assume it works 
                // For now, let's skip complex audit logging here to minimize breakage unless we verify lib/audit.ts signature
                // We can add it back if the user requests strict auditing on admin side too.
            } catch (e) {
                console.error("Audit log failed", e);
            }

            return NextResponse.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
                isAdmin: user.isAdmin,
                token,
            });
        } else {
            return NextResponse.json({
                error: "Invalid credentials"
            }, { status: 401 });
        }
    } catch (error) {
        console.error("Admin Login Error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
