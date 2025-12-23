import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import cloudinary, { getPublicIdFromUrl } from "@/lib/cloudinary";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if exists
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: { orderItems: true, preOrderItems: true }
        },
        campaigns: {
          select: {
            id: true,
            status: true,
            _count: { select: { preOrders: true } }
          }
        }
      }
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // 1. Check for real Orders or simple PreOrders
    if (product._count.orderItems > 0 || product._count.preOrderItems > 0) {
      return NextResponse.json({
        error: `Cannot delete product. It has ${product._count.orderItems} orders and ${product._count.preOrderItems} pre-orders. Archive it instead.`
      }, { status: 400 });
    }

    // 2. Check Campaigns logic
    // We can auto-delete campaigns ONLY if they have NO entries and are NOT active/fulfilled/closed (unless 0 orders)
    // Actually, safemode: If campaign has ANY entries, we block. If it's Active, we block.
    // If it's Draft or Cancelled AND has 0 entries, we auto-delete.

    const blockingCampaigns = product.campaigns.filter(c =>
      c._count.preOrders > 0 || // Has financial records
      ["active", "fulfilled", "closed"].includes(c.status) // Is/Was active (safety measure)
    );

    if (blockingCampaigns.length > 0) {
      return NextResponse.json({
        error: `Cannot delete product. It has ${blockingCampaigns.length} active/fulfilled campaigns or campaigns with existing orders. Please delete them manually first.`
      }, { status: 400 });
    }

    // Gather IDs of safe-to-delete campaigns (Draft/Cancelled with 0 orders)
    const campaignIdsToDelete = product.campaigns.map(c => c.id);

    // 3. Cleanup Cloudinary Images
    // Collect all image URLs to delete
    const imagesToDelete = product.images || [];

    // Delete from Cloudinary
    if (imagesToDelete.length > 0) {
      try {
        const publicIds = imagesToDelete
          .map((url) => getPublicIdFromUrl(url))
          .filter((id): id is string => !!id);

        if (publicIds.length > 0) {
          // Verify we are not deleting placeholders if any (though getPublicId checks this roughly)
          // Use Cloudinary Admin API to delete resources
          await cloudinary.api.delete_resources(publicIds);
          console.log(`Deleted ${publicIds.length} images from Cloudinary`);
        }
      } catch (imgError) {
        console.error("Failed to delete images from Cloudinary:", imgError);
        // We do NOT block product deletion if image deletion fails, 
        // but we should probably log it or perhaps warn. 
        // For now, allow proceed to avoid locking DB cleanup.
      }
    }

    // Cleanup related data
    await prisma.$transaction([
      prisma.review.deleteMany({ where: { productId: id } }),
      prisma.preorder.deleteMany({ where: { productId: id } }),
      // Delete the safe campaigns
      prisma.preOrderCampaign.deleteMany({
        where: { id: { in: campaignIdsToDelete } }
      }),
      prisma.product.delete({ where: { id } })
    ]);

    return NextResponse.json({ message: "Product and associated cancelled/draft campaigns removed successfully" });

  } catch (error: any) {
    console.error("Delete Error:", error);
    // Handle Prisma Foreign Key Constraint codes
    if (error.code === 'P2003') {
      return NextResponse.json({ error: "Cannot delete product due to related records (e.g. Campaigns, Orders)" }, { status: 400 });
    }
    return NextResponse.json({ error: "Server Error: " + error.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description,
        price: parseFloat(body.price),
        stock: parseInt(body.stock) || 0,
        category: body.category,
        images: body.images || (body.image ? [body.image] : undefined),
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}