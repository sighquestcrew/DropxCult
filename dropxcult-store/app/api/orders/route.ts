import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import Razorpay from "razorpay";
import jwt from "jsonwebtoken";

// Helper to extract user ID from Authorization header
const getUserId = (req: Request): string | null => {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as { _id: string };
    return decoded._id;
  } catch (error) {
    return null;
  }
};

export async function POST(req: Request) {
  try {
    const { items, shippingAddress, couponCode, discountAmount } = await req.json();
    const validDiscount = typeof discountAmount === 'number' && discountAmount > 0 ? discountAmount : 0;

    // Get user ID (optional - allows guest checkout)
    const userId = getUserId(req);

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items in order" }, { status: 400 });
    }

    // --- 1. SERVER-SIDE PRICE VERIFICATION (Security) ---
    let calculatedTotal = 0;
    const verifiedItems = [];

    // Pre-fetch a default product for custom items (fallback)
    // We try to find a product that might represent "Custom" or just take the first one.
    // In a real app, you should have a dedicated 'custom-tshirt' product in DB.
    const defaultProduct = await prisma.product.findFirst();

    if (!defaultProduct) {
      // Severe error: No products in DB, cannot create order items due to FK constraint
      console.error("CRITICAL: No products found in database. Cannot create order items.");
      return NextResponse.json({ error: "System Error: No products available to link order." }, { status: 500 });
    }

    for (const item of items) {
      console.log(`Processing Item: ${item.name}, isCustom: ${item.isCustom}, designId: ${item.designId}`);

      if (item.isCustom || item.designId) {
        // Handle Custom Design
        let customDesign = await prisma.customRequest.findUnique({
          where: { id: item.designId }
        });

        let design3D = null;
        if (!customDesign) {
          design3D = await prisma.design.findUnique({
            where: { id: item.designId }
          });
        }

        if (!customDesign && !design3D) {
          // If design not found in DB, we might still want to proceed if it's just a test
          // But strict mode says throw. For robustness, let's log and throw.
          console.error(`Design ${item.designId} not found`);
          throw new Error(`Custom design not found`);
        }

        let price = 999; // Default fallback

        if (design3D) {
          // 3D Design pricing - flat rate based on t-shirt type
          const isOversized = design3D.tshirtType === "oversized";
          price = isOversized ? 1299 : 999;
        } else if (customDesign) {
          // Pricing logic for 2D custom
          const designData = customDesign as any;
          // Safely access textConfig, defaulting to empty object if null
          const textConfig = (customDesign as any).textConfig || {};

          const hasSleeveImages =
            (designData.leftImage && designData.leftImage !== "") ||
            (designData.rightImage && designData.rightImage !== "") ||
            (designData.leftSleeveImage && designData.leftSleeveImage !== "") ||
            (designData.rightSleeveImage && designData.rightSleeveImage !== "");

          const leftText = textConfig?.left?.content;
          const rightText = textConfig?.right?.content;
          const hasSleeveText = (leftText && leftText.trim() !== "") || (rightText && rightText.trim() !== "");

          price = (hasSleeveImages || hasSleeveText) ? 1199 : 999;
        } else {
          // Fallback if neither exists (should be caught above, but for safety)
          price = 999;
        }

        calculatedTotal += price * item.qty;

        verifiedItems.push({
          name: item.name,
          qty: item.qty,
          image: item.image,
          price: price,
          size: item.size,
          isCustom: true, // Custom design from Community
          // Use the default product ID for ALL custom items to satisfy Foreign Key
          productId: defaultProduct.id
        });

      } else {
        // Handle Standard Product
        // Try to find product by ID first (item.id from cart), fallback to _id for compatibility
        const productId = item.id || item._id;
        let product = null;

        if (productId) {
          product = await prisma.product.findUnique({ where: { id: productId } });
        }

        // Fallback: try to find by name if ID lookup fails
        if (!product && item.name) {
          product = await prisma.product.findFirst({ where: { name: item.name } });
        }

        if (!product) {
          // FALLBACK: Treat as a legacy custom design (old cart items)
          console.log(`Product not found, treating as legacy custom design: ID=${productId}, Name=${item.name}`);

          const legacyPrice = item.price || 999;
          calculatedTotal += legacyPrice * item.qty;

          verifiedItems.push({
            name: item.name,
            qty: item.qty,
            image: item.image,
            price: legacyPrice,
            size: item.size,
            isCustom: false, // Treat as Shop Design so Review button shows
            designId: productId, // Save the Design ID
            productId: defaultProduct.id // Use fallback product
          });
        } else {
          calculatedTotal += product.price * item.qty;

          verifiedItems.push({
            name: item.name,
            qty: item.qty,
            image: item.image,
            price: product.price,
            size: item.size,
            isCustom: false, // Shop product
            designId: null,
            productId: product.id
          });
        }
      }
    }

    // --- 2. Initialize Razorpay ---
    if (!process.env.RAZORPAY_API_KEY || !process.env.RAZORPAY_API_SECRET) {
      console.error("Missing Razorpay API keys");
      return NextResponse.json({
        error: "Payment gateway not configured. Set RAZORPAY_API_KEY and RAZORPAY_API_SECRET in .env"
      }, { status: 500 });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_API_KEY,
      key_secret: process.env.RAZORPAY_API_SECRET,
    });

    // --- 3. Create Order in Razorpay ---
    // Apply discount to calculate final amount
    const finalTotal = Math.max(0, calculatedTotal - validDiscount);

    // Note: Razorpay supports UPI automatically. No special 'method' param needed here for creation.
    const options = {
      amount: finalTotal * 100, // paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        // Add useful notes for Razorpay dashboard
        shipping_name: shippingAddress.fullName,
        coupon: couponCode || 'none',
        discount: validDiscount
      }
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // --- 4. Save Order to Postgres ---
    const order = await prisma.order.create({
      data: {
        userId: userId, // Link to user (null for guests)
        shippingAddress: shippingAddress,
        paymentMethod: "Razorpay", // Initially just "Razorpay", updated on verify
        itemsPrice: calculatedTotal,
        taxPrice: 0,
        shippingPrice: 0,
        totalPrice: finalTotal, // Use discounted total
        paymentResult: {
          id: razorpayOrder.id,
          status: "pending",
          couponCode: couponCode || null, // Store coupon for usage tracking
        },
        orderItems: {
          create: verifiedItems.map(item => ({
            name: item.name,
            qty: item.qty,
            image: item.image,
            price: item.price,
            size: item.size,
            isCustom: item.isCustom,
            designId: item.designId, // Save designId if present
            productId: item.productId
          }))
        }
      }
    });

    return NextResponse.json({
      orderId: order.id,
      razorpayOrderId: razorpayOrder.id,
      amount: calculatedTotal,
      currency: "INR"
    });

  } catch (error: any) {
    console.error("Order Creation Logic Error:", error);
    return NextResponse.json({
      error: error.message || "Failed to create order"
    }, { status: 500 });
  }
}