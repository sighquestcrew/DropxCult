import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> } // Updated for Next.js 15
) {
  try {
    const { slug } = await params; // Await params in Next.js 15

    // Check if this is a 3D design slug
    if (slug.startsWith("design-")) {
      const designId = slug.replace("design-", "");
      const design = await prisma.design.findFirst({
        where: {
          id: designId,
          isPublic: true,
          status: "Accepted"
        },
        include: { user: { select: { name: true } } }
      });

      if (!design) {
        return NextResponse.json({ error: "Design not found" }, { status: 404 });
      }

      // Format design as product
      const designProduct = {
        id: design.id,
        name: design.name,
        slug: `design-${design.id}`,
        description: `3D Custom Design by ${design.user?.name || 'Designer'}`,
        price: 1299,
        category: "Custom Design",
        images: design.previewImage ? [design.previewImage] : [],
        sizes: ["S", "M", "L", "XL", "XXL"],
        stock: 99,
        isFeatured: false,
        createdAt: design.createdAt,
        is3DDesign: true,
        designerId: design.userId,
        designerName: design.user?.name,
        tshirtType: design.tshirtType,
        tshirtColor: design.tshirtColor
      };

      return NextResponse.json(designProduct);
    }

    // Regular product lookup
    const product = await prisma.product.findUnique({
      where: { slug }
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Product fetch error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}