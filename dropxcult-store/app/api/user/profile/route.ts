import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// Updated Rank Logic
const calculateRank = (score: number, isAdmin: boolean) => {
  if (isAdmin) return "Founder"; // Admins are always Founders

  if (score >= 100) return "Elder";
  if (score >= 60) return "Zealot";
  if (score >= 20) return "Apostle";
  if (score >= 5) return "Disciple";
  if (score >= 1) return "Acolyte";
  return "Initiate";
};

const getUser = (req: Request) => {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  try {
    return jwt.verify(token, process.env.NEXTAUTH_SECRET!) as { _id: string };
  } catch (error) {
    return null;
  }
};

// GET: Fetch Profile
export async function GET(req: Request) {
  try {
    const decoded = getUser(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: decoded._id },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    // 1. Get Live Stats
    const ordersCount = await prisma.order.count({
      where: { userId: user.id, isPaid: true }
    });
    const designsApproved = await prisma.customRequest.count({
      where: { userId: user.id, status: "Accepted" }
    });
    const score = ordersCount + designsApproved;

    // 2. Update Rank
    const newRank = calculateRank(score, user.isAdmin);

    // Check if we need to update the DB
    if (user.rank !== newRank || user.ordersCount !== ordersCount || user.designsApproved !== designsApproved) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          rank: newRank,
          ordersCount,
          designsApproved
        }
      });
      // Update local object for response
      userWithoutPassword.rank = newRank;
      userWithoutPassword.ordersCount = ordersCount;
      userWithoutPassword.designsApproved = designsApproved;
    }

    // 3. Get Recent Orders with items (only show PAID orders)
    const recentOrders = await prisma.order.findMany({
      where: {
        userId: user.id,
        isPaid: true  // Only show confirmed orders
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        orderItems: {
          include: {
            product: {
              select: { slug: true, name: true }
            }
          }
        }
      }
    });

    // 4. Get User Designs (Both 2D CustomRequests and 3D Designs)
    const customRequests = await prisma.customRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        status: true,
        createdAt: true,
        frontImage: true,
        backImage: true,
        // Map fields to match unified design interface
        // 2D designs don't have 'name' usually
      }
    });

    const designs3D = await prisma.design.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        previewImage: true,
        tshirtColor: true,
        likesCount: true,
        isPublic: true,
        hasRoyaltyOffer: true, // Needed for Creator badge
      }
    });

    // Check if user is a "Creator" (has at least one design with royalty)
    const isCreator = designs3D.some(d => d.hasRoyaltyOffer === true);

    // Unified Design Interface for Frontend
    const unifiedDesigns = [
      ...customRequests.map(d => ({
        id: d.id,
        type: '2D',
        name: d.type || "Custom Request",
        status: d.status,
        createdAt: d.createdAt,
        previewImage: d.frontImage, // Use front image as preview
        frontImage: d.frontImage,
        backImage: d.backImage,
        isPublic: false // 2D requests are private by default logic for now
      })),
      ...designs3D.map(d => ({
        id: d.id,
        type: '3D',
        name: d.name || "Untitled Design",
        status: d.status,
        createdAt: d.createdAt,
        previewImage: d.previewImage,
        likesCount: d.likesCount,
        isPublic: d.isPublic
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      user: { ...userWithoutPassword, isCreator }, // Add isCreator flag
      orders: recentOrders,
      designs: unifiedDesigns
    });
  } catch (error) {
    console.error("Profile GET Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// PUT: Update Profile
export async function PUT(req: Request) {
  try {
    const decoded = getUser(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, bio, image, banner, email, password } = await req.json();

    const dataToUpdate: any = {};
    if (name) dataToUpdate.name = name;
    if (bio) dataToUpdate.bio = bio;
    if (image) dataToUpdate.image = image;
    if (banner !== undefined) dataToUpdate.banner = banner; // Can be set to null/empty to remove
    if (email) dataToUpdate.email = email;

    if (password && password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      dataToUpdate.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await prisma.user.update({
      where: { id: decoded._id },
      data: dataToUpdate
    });

    return NextResponse.json({
      _id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
      image: updatedUser.image,
      banner: updatedUser.banner,
      bio: updatedUser.bio,
      rank: updatedUser.rank,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// DELETE: Delete Account
export async function DELETE(req: Request) {
  try {
    const decoded = getUser(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.user.delete({
      where: { id: decoded._id }
    });
    return NextResponse.json({ message: "Account Deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}