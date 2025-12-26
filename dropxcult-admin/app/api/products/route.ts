import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTokenFromRequest, verifyAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  // 🛡️ SECURITY: Admin Only
  const token = await getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await verifyAuth(token);
  if (!user || !user.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);

  // Parse query parameters
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const featured = searchParams.get("featured") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  try {
    // Build where clause
    const where: any = {};

    // Search by name or description
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Filter by category
    if (category) {
      where.category = category;
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    // Filter by featured
    if (featured === "true") {
      where.isFeatured = true;
    }

    // Get total count
    const total = await prisma.product.count({ where });

    // Fetch products with pagination
    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    // Get categories for filter dropdown
    const categories = await prisma.product.groupBy({
      by: ['category'],
      _count: true
    });

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      categories: categories.map(c => ({ name: c.category, count: c._count }))
    });
  } catch (error) {
    console.error("Products fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

// POST - Create new product
export async function POST(req: NextRequest) {
  try {
    // 🛡️ SECURITY: Admin Only
    const token = await getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await verifyAuth(token);
    if (!user || !user.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();

    const { name, price, description, category, garmentType, images, slug } = body;

    // Basic Validation - accept both 'images' array or legacy 'image' string
    const imageArray = images || (body.image ? [body.image] : []);
    if (!name || !price || imageArray.length === 0 || !slug) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        price: Number(price),
        category,
        garmentType: garmentType || "T-Shirt",
        images: imageArray,
        sizes: ["S", "M", "L", "XL", "XXL"],
        stock: 50,
        isFeatured: false,
      }
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Create Product Error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}