import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, subject, message } = body;

        if (!name || !email || !subject || !message) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        const inquiry = await prisma.inquiry.create({
            data: {
                name,
                email,
                subject,
                message,
                status: "Pending"
            }
        });

        return NextResponse.json(inquiry);
    } catch (error) {
        console.error("Contact API Error:", error);
        return NextResponse.json({ error: "Failed to submit inquiry" }, { status: 500 });
    }
}
