import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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
      price: 1299, // Default price for custom designs
      category: "Custom Design",
      images: design.previewImage ? [design.previewImage] : [],
      sizes: ["S", "M", "L", "XL"],
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

// ADD THIS BELOW THE GET FUNCTION:
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { name, price, description, category, image, slug } = body;

    // Basic Validation
    if (!name || !price || !image || !slug) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        price: Number(price),
        category,
        images: [image], // We store it as an array
        sizes: ["S", "M", "L", "XL"], // Default sizes
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