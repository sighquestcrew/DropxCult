import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

const getDataFromToken = (request: NextRequest) => {
  try {
    const token = request.cookies.get("token")?.value || "";
    if (!token) return null;
    const decoded: any = jwt.verify(token, process.env.TOKEN_SECRET!);
    return decoded.id;
  } catch (error: any) {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    // Check if we should only return admin products (for home page)
    const { searchParams } = new URL(req.url);
    const adminOnly = searchParams.get('adminOnly') === 'true';

    // Fetch all products (admin products), sort by newest first
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // If adminOnly, just return products without user designs
    if (adminOnly) {
      return NextResponse.json(products);
    }

    // Fetch designs with royalty for shop page (NOT isPublic - that's for community only)
    const publicDesigns = await prisma.design.findMany({
      where: {
        hasRoyaltyOffer: true, // Only show designs where user accepted royalty deal
        status: "Accepted"
      },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });

    // Format public designs to look like products
    const designProducts = publicDesigns.map((design: any) => ({
      id: design.id,
      name: design.name,
      slug: `design-${design.id}`,
      description: `3D Custom Design by ${design.user?.name || 'Designer'}`,
      price: 999, // Fixed price for all custom designs
      category: "Custom Design",
      images: design.previewImage ? [design.previewImage] : [],
      sizes: ["S", "M", "L", "XL", "XXL"],
      stock: 99,
      isFeatured: false,
      createdAt: design.createdAt,
      is3DDesign: true, // Flag to identify 3D designs
      designerId: design.userId,
      designerName: design.user?.name,
      tshirtType: design.tshirtType,
      tshirtColor: design.tshirtColor
    }));

    // Combine products and public designs
    const allProducts = [...products, ...designProducts].sort((a: any, b: any) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(allProducts);
  } catch (error) {
    console.error("Fetch products error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.number().min(0, "Price must be positive"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  category: z.string().optional(),
  image: z.string().url("Invalid image URL"),
});

// ADD THIS BELOW THE GET FUNCTION:
export async function POST(req: NextRequest) {
  try {
    const userId = getDataFromToken(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();

    // Zod Validation
    const result = productSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { name, price, slug, description, category, image } = result.data;

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description: description || "",
        price: Number(price),
        category: category || "General",
        images: [image], // We store it as an array
        sizes: ["S", "M", "L", "XL", "XXL"], // Default sizes
        stock: 50, // Default stock
        isFeatured: false,
      }
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Create Product Error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}