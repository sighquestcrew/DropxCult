import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

// Get user from token
const getUser = (req: Request) => {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    const token = authHeader.split(" ")[1];
    try {
        return jwt.verify(token, process.env.NEXTAUTH_SECRET!) as { _id: string; email: string; name: string };
    } catch {
        return null;
    }
};

// GET: Fetch reviews for a product
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const productId = searchParams.get("productId");

        if (!productId) {
            return NextResponse.json({ error: "Product ID required" }, { status: 400 });
        }

        const reviews = await prisma.review.findMany({
            where: { productId },
            include: {
                user: {
                    select: { id: true, name: true, image: true }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        // Calculate average rating
        const avgRating = reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;

        return NextResponse.json({
            reviews,
            stats: {
                count: reviews.length,
                average: Math.round(avgRating * 10) / 10, // Round to 1 decimal
                distribution: {
                    5: reviews.filter(r => r.rating === 5).length,
                    4: reviews.filter(r => r.rating === 4).length,
                    3: reviews.filter(r => r.rating === 3).length,
                    2: reviews.filter(r => r.rating === 2).length,
                    1: reviews.filter(r => r.rating === 1).length,
                }
            }
        });

    } catch (error: any) {
        console.error("Fetch Reviews Error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

// POST: Create a review
export async function POST(req: Request) {
    try {
        const user = getUser(req);
        if (!user) {
            return NextResponse.json({ error: "Please login to review" }, { status: 401 });
        }

        const { productId, rating, title, comment, images } = await req.json();

        if (!productId || !rating || !comment) {
            return NextResponse.json({ error: "Product, rating, and comment are required" }, { status: 400 });
        }

        if (rating < 1 || rating > 5) {
            return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
        }

        // Check if user already reviewed this product
        const existingReview = await prisma.review.findUnique({
            where: {
                userId_productId: {
                    userId: user._id,
                    productId
                }
            }
        });

        if (existingReview) {
            return NextResponse.json({ error: "You have already reviewed this product" }, { status: 400 });
        }

        // Check if user has purchased this product (for verified badge)
        const hasPurchased = await prisma.orderItem.findFirst({
            where: {
                productId,
                order: {
                    userId: user._id,
                    isPaid: true
                }
            }
        });

        const review = await prisma.review.create({
            data: {
                userId: user._id,
                productId,
                rating,
                title: title || null,
                comment,
                images: images || [],
                isVerified: !!hasPurchased
            },
            include: {
                user: {
                    select: { id: true, name: true, image: true }
                }
            }
        });

        return NextResponse.json({
            success: true,
            review,
            message: hasPurchased ? "Review submitted with verified badge!" : "Review submitted!"
        });

    } catch (error: any) {
        console.error("Create Review Error:", error);
        return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
    }
}
