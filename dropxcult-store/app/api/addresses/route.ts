import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

// Get user from token
const getUser = (req: Request) => {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    const token = authHeader.split(" ")[1];
    try {
        return jwt.verify(token, process.env.NEXTAUTH_SECRET!) as { _id: string };
    } catch {
        return null;
    }
};

// GET: Fetch user's addresses
export async function GET(req: Request) {
    try {
        const user = getUser(req);
        if (!user) {
            return NextResponse.json({ error: "Please login" }, { status: 401 });
        }

        const addresses = await prisma.address.findMany({
            where: { userId: user._id },
            orderBy: [
                { isDefault: "desc" },
                { createdAt: "desc" }
            ]
        });

        return NextResponse.json(addresses);
    } catch (error) {
        console.error("Fetch Addresses Error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

// POST: Create new address
export async function POST(req: Request) {
    try {
        const user = getUser(req);
        if (!user) {
            return NextResponse.json({ error: "Please login" }, { status: 401 });
        }

        const body = await req.json();
        const { fullName, phone, address, city, state, postalCode, country, isDefault } = body;

        if (!fullName || !phone || !address || !city || !state || !postalCode) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        // If this is set as default, unset other defaults
        if (isDefault) {
            await prisma.address.updateMany({
                where: { userId: user._id, isDefault: true },
                data: { isDefault: false }
            });
        }

        // Check if this is first address (make it default)
        const existingCount = await prisma.address.count({ where: { userId: user._id } });

        const newAddress = await prisma.address.create({
            data: {
                userId: user._id,
                fullName,
                phone,
                address,
                city,
                state,
                postalCode,
                country: country || "India",
                isDefault: isDefault || existingCount === 0
            }
        });

        return NextResponse.json({ success: true, address: newAddress });
    } catch (error) {
        console.error("Create Address Error:", error);
        return NextResponse.json({ error: "Failed to save address" }, { status: 500 });
    }
}

// DELETE: Remove address
export async function DELETE(req: Request) {
    try {
        const user = getUser(req);
        if (!user) {
            return NextResponse.json({ error: "Please login" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const addressId = searchParams.get("id");

        if (!addressId) {
            return NextResponse.json({ error: "Address ID required" }, { status: 400 });
        }

        // Verify ownership
        const address = await prisma.address.findFirst({
            where: { id: addressId, userId: user._id }
        });

        if (!address) {
            return NextResponse.json({ error: "Address not found" }, { status: 404 });
        }

        await prisma.address.delete({ where: { id: addressId } });

        // If deleted address was default, set another as default
        if (address.isDefault) {
            const anotherAddress = await prisma.address.findFirst({
                where: { userId: user._id },
                orderBy: { createdAt: "desc" }
            });
            if (anotherAddress) {
                await prisma.address.update({
                    where: { id: anotherAddress.id },
                    data: { isDefault: true }
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete Address Error:", error);
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}

// PATCH: Set address as default
export async function PATCH(req: Request) {
    try {
        const user = getUser(req);
        if (!user) {
            return NextResponse.json({ error: "Please login" }, { status: 401 });
        }

        const { id } = await req.json();

        if (!id) {
            return NextResponse.json({ error: "Address ID required" }, { status: 400 });
        }

        // Verify ownership
        const address = await prisma.address.findFirst({
            where: { id, userId: user._id }
        });

        if (!address) {
            return NextResponse.json({ error: "Address not found" }, { status: 404 });
        }

        // Unset all defaults, then set this one
        await prisma.address.updateMany({
            where: { userId: user._id, isDefault: true },
            data: { isDefault: false }
        });

        await prisma.address.update({
            where: { id },
            data: { isDefault: true }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Set Default Error:", error);
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}
