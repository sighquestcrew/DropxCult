import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { sendOrderConfirmation } from "@/lib/email";

export async function POST(req: Request) {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            orderId,
        } = await req.json();

        // Validate required fields
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
            return NextResponse.json(
                { error: "Missing required payment verification fields" },
                { status: 400 }
            );
        }

        // Validate Secret
        if (!process.env.RAZORPAY_API_SECRET) {
            console.error("RAZORPAY_API_SECRET is not set.");
            return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
        }

        // Generate signature for verification
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
            .update(body.toString())
            .digest("hex");

        // Verify signature
        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            // First, get the current order to check for coupon
            const currentOrder = await prisma.order.findUnique({
                where: { id: orderId },
                select: { paymentResult: true }
            });
            const paymentResult = currentOrder?.paymentResult as any;
            const usedCouponCode = paymentResult?.couponCode;

            // Update order status in database
            const order = await prisma.order.update({
                where: { id: orderId },
                data: {
                    isPaid: true,
                    paidAt: new Date(),
                    paymentResult: {
                        id: razorpay_payment_id,
                        status: "completed",
                        razorpay_order_id,
                        razorpay_signature,
                        couponCode: usedCouponCode || null, // Preserve coupon info
                    },
                    // If we could determine it was UPI, we would here, but Razorpay standard checkout just says "paid".
                    // We stick to "Razorpay" (which captures Cards/UPI/Netbanking).
                    paymentMethod: "Razorpay"
                },
                include: {
                    orderItems: true,
                    user: true,
                }
            });

            // Increment coupon usage if a coupon was used
            if (usedCouponCode) {
                try {
                    await prisma.coupon.update({
                        where: { code: usedCouponCode },
                        data: { usedCount: { increment: 1 } }
                    });
                    console.log(`Coupon ${usedCouponCode} usage incremented`);
                } catch (couponError) {
                    console.error("Failed to increment coupon usage:", couponError);
                    // Don't fail the order, just log
                }
            }

            // Decrement Product Stock
            try {
                // We use a loop here because we need to update multiple products. 
                // A transaction would be ideal but a simple loop is sufficient for this scale.
                for (const item of order.orderItems) {
                    if (item.productId) {
                        // Check if it's a real product (not a custom design fallback if logic differs, 
                        // but usually everything with a productId in DB should track stock)
                        await prisma.product.update({
                            where: { id: item.productId },
                            data: { stock: { decrement: item.qty } }
                        });
                        console.log(`Decremented stock for product ${item.productId} by ${item.qty}`);
                    }
                }
            } catch (stockError) {
                console.error("Failed to update product stock:", stockError);
                // Critical error but we shouldn't fail the request response after payment is already verified.
                // In a real system, we might want to alert admin.
            }

            // Send order confirmation email
            try {
                if (order.user?.email) {
                    const shippingAddr = order.shippingAddress as any;
                    const address = shippingAddr
                        ? `${shippingAddr.fullName || ''}, ${shippingAddr.address || ''}, ${shippingAddr.city || ''}, ${shippingAddr.state || ''} - ${shippingAddr.postalCode || ''}`
                        : 'Address not available';

                    await sendOrderConfirmation({
                        orderId: order.id,
                        customerName: order.user.name || 'Customer',
                        customerEmail: order.user.email,
                        items: order.orderItems.map((item: any) => ({
                            name: item.name,
                            size: item.size || 'N/A',
                            qty: item.qty,
                            price: item.price,
                        })),
                        total: order.totalPrice,
                        address,
                    });
                }
            } catch (emailError) {
                console.error("Failed to send order confirmation email", emailError);
                // Don't fail the request, just log it
            }

            // Credit Royalties to Designers for Custom Designs
            try {
                console.log("Processing royalties for order:", orderId);

                for (const item of order.orderItems) {
                    // Only process items with designId (custom designs)
                    if (item.designId) {
                        console.log(`Processing royalty for designId: ${item.designId}`);

                        // Try to find the design in CustomRequest first
                        let designerUserId: string | null = null;
                        let designType: string = "unknown";

                        const customRequest = await prisma.customRequest.findUnique({
                            where: { id: item.designId },
                            select: { userId: true }
                        });

                        if (customRequest) {
                            designerUserId = customRequest.userId;
                            designType = "CustomRequest";
                        } else {
                            // If not found in CustomRequest, check Design table
                            const design3D = await prisma.design.findUnique({
                                where: { id: item.designId },
                                select: { userId: true }
                            });

                            if (design3D) {
                                designerUserId = design3D.userId;
                                designType = "Design";
                            }
                        }

                        if (designerUserId) {
                            // Check if buyer is different from designer (no self-royalty)
                            if (order.userId && order.userId === designerUserId) {
                                console.log(`Skipping royalty: Designer ${designerUserId} purchased their own design`);
                                continue;
                            }

                            // Calculate 10% royalty
                            const royaltyAmount = Math.round((item.price * item.qty) * 0.10);

                            console.log(`Crediting ${royaltyAmount} royalty to designer ${designerUserId} for ${designType}`);

                            // Update designer's royalty points and earnings
                            await prisma.user.update({
                                where: { id: designerUserId },
                                data: {
                                    royaltyPoints: { increment: royaltyAmount },
                                    royaltyEarnings: { increment: royaltyAmount }
                                }
                            });

                            console.log(`✅ Royalty credited: ₹${royaltyAmount} to user ${designerUserId}`);
                        } else {
                            console.log(`⚠️ Design ${item.designId} not found in CustomRequest or Design tables`);
                        }
                    }
                }

                console.log("Royalty processing completed");
            } catch (royaltyError) {
                console.error("Failed to process royalties:", royaltyError);
                // Don't fail the order completion, just log the error
                // Admin can manually credit royalties if needed
            }

            return NextResponse.json({
                success: true,
                message: "Payment verified successfully",
                orderId,
                paymentId: razorpay_payment_id,
            });
        } else {
            // Payment verification failed
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    paymentResult: {
                        id: razorpay_payment_id,
                        status: "failed",
                        error: "Signature verification failed",
                    },
                },
            });

            return NextResponse.json(
                { error: "Payment verification failed - invalid signature" },
                { status: 400 }
            );
        }
    } catch (error: any) {
        console.error("Payment Verification Error:", error);
        return NextResponse.json(
            { error: error.message || "Payment verification failed" },
            { status: 500 }
        );
    }
}

