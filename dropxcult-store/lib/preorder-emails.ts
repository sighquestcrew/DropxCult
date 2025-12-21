import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@dropxcult.com";

interface PreOrderEmailData {
    to: string;
    customerName: string;
    orderNumber: string;
    productName: string;
    size: string;
    quantity: number;
    totalAmount: number;
    expectedDelivery: string;
}

// Pre-order confirmation
export async function sendPreOrderConfirmation(data: PreOrderEmailData) {
    const { to, customerName, orderNumber, productName, size, quantity, totalAmount, expectedDelivery } = data;

    try {
        await resend.emails.send({
            from: `DropXCult <${FROM_EMAIL}>`,
            to,
            subject: `🎉 Pre-Order Confirmed! #${orderNumber}`,
            html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; background: #000; color: #fff; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { text-align: center; padding: 20px; background: linear-gradient(135deg, #9333ea, #ec4899); border-radius: 10px; }
        .content { padding: 30px 20px; }
        .box { background: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 20px; margin: 15px 0; }
        .timeline { border-left: 3px solid #9333ea; padding-left: 20px; margin: 20px 0; }
        .timeline-item { margin-bottom: 15px; }
        .check { color: #22c55e; }
        .pending { color: #6b7280; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin:0;">🎉 Pre-Order Confirmed!</h1>
        </div>
        <div class="content">
            <p>Hi <strong>${customerName}</strong>,</p>
            <p>Thanks for your pre-order! Here's what happens next:</p>
            
            <div class="box">
                <h3 style="margin-top:0;">${productName}</h3>
                <p>Size: ${size} × ${quantity}</p>
                <p style="font-size: 24px; color: #a855f7; font-weight: bold;">₹${totalAmount.toLocaleString()}</p>
            </div>
            
            <div class="timeline">
                <div class="timeline-item">
                    <span class="check">✅</span> <strong>Pre-order placed</strong> - Payment received
                </div>
                <div class="timeline-item">
                    <span class="pending">⏳</span> <strong>Pre-order window closes</strong> - Awaiting
                </div>
                <div class="timeline-item">
                    <span class="pending">⚙️</span> <strong>Production starts</strong> - Coming soon
                </div>
                <div class="timeline-item">
                    <span class="pending">📦</span> <strong>Shipped</strong> - ETA: ${expectedDelivery}
                </div>
            </div>
            
            <div class="box" style="background: #581c87;">
                <p style="margin:0; font-size: 14px;">
                    <strong>📢 Important:</strong> If enough orders aren't reached by the deadline, 
                    you'll receive a full refund within 3-5 business days.
                </p>
            </div>
            
            <p style="color: #9ca3af;">Order #${orderNumber}</p>
        </div>
        <div class="footer">
            <p>© DropXCult - Premium Streetwear</p>
        </div>
    </div>
</body>
</html>
            `
        });
        return { success: true };
    } catch (error) {
        console.error("Pre-order confirmation email failed:", error);
        return { success: false, error };
    }
}

// Campaign closed - production starting
export async function sendProductionStarted(data: Pick<PreOrderEmailData, 'to' | 'customerName' | 'orderNumber' | 'productName' | 'expectedDelivery'>) {
    const { to, customerName, orderNumber, productName, expectedDelivery } = data;

    try {
        await resend.emails.send({
            from: `DropXCult <${FROM_EMAIL}>`,
            to,
            subject: `🎯 Good News! Your order is in production #${orderNumber}`,
            html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; background: #000; color: #fff; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { text-align: center; padding: 20px; background: linear-gradient(135deg, #9333ea, #ec4899); border-radius: 10px; }
        .content { padding: 30px 20px; }
        .box { background: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 20px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin:0;">⚙️ Production Started!</h1>
        </div>
        <div class="content">
            <p>Hi <strong>${customerName}</strong>,</p>
            <p>Great news! Your pre-order has reached the goal and is now in production.</p>
            
            <div class="box">
                <h3>${productName}</h3>
                <p>Order: <strong>#${orderNumber}</strong></p>
                <p>Expected delivery: <strong>${expectedDelivery}</strong></p>
            </div>
            
            <p>We'll send you a tracking number once shipped!</p>
        </div>
    </div>
</body>
</html>
            `
        });
        return { success: true };
    } catch (error) {
        console.error("Production email failed:", error);
        return { success: false, error };
    }
}

// Shipped notification
export async function sendShippedNotification(data: Pick<PreOrderEmailData, 'to' | 'customerName' | 'orderNumber' | 'productName'> & { trackingNumber: string; courier: string }) {
    const { to, customerName, orderNumber, productName, trackingNumber, courier } = data;

    try {
        await resend.emails.send({
            from: `DropXCult <${FROM_EMAIL}>`,
            to,
            subject: `📦 Your order has shipped! #${orderNumber}`,
            html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; background: #000; color: #fff; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { text-align: center; padding: 20px; background: linear-gradient(135deg, #22c55e, #16a34a); border-radius: 10px; }
        .content { padding: 30px 20px; }
        .tracking { background: #18181b; border: 2px solid #22c55e; border-radius: 8px; padding: 20px; margin: 15px 0; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin:0;">📦 Order Shipped!</h1>
        </div>
        <div class="content">
            <p>Hi <strong>${customerName}</strong>,</p>
            <p>Your order is on its way!</p>
            
            <div class="tracking">
                <p style="margin:0; color: #9ca3af;">Tracking Number</p>
                <h2 style="color: #22c55e; margin: 10px 0;">${trackingNumber}</h2>
                <p style="margin:0;">Courier: ${courier}</p>
            </div>
            
            <p><strong>${productName}</strong></p>
            <p>Order #${orderNumber}</p>
        </div>
    </div>
</body>
</html>
            `
        });
        return { success: true };
    } catch (error) {
        console.error("Shipped email failed:", error);
        return { success: false, error };
    }
}

// Refund notification (min qty not met)
export async function sendRefundNotification(data: Pick<PreOrderEmailData, 'to' | 'customerName' | 'orderNumber' | 'productName' | 'totalAmount'>) {
    const { to, customerName, orderNumber, productName, totalAmount } = data;

    try {
        await resend.emails.send({
            from: `DropXCult <${FROM_EMAIL}>`,
            to,
            subject: `💸 Refund Initiated - Order #${orderNumber}`,
            html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; background: #000; color: #fff; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { text-align: center; padding: 20px; background: #ef4444; border-radius: 10px; }
        .content { padding: 30px 20px; }
        .box { background: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 20px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin:0;">💸 Refund Initiated</h1>
        </div>
        <div class="content">
            <p>Hi <strong>${customerName}</strong>,</p>
            <p>Unfortunately, the pre-order campaign for <strong>${productName}</strong> didn't reach the minimum orders required for production.</p>
            
            <div class="box">
                <p>We're issuing a <strong>full refund</strong> of:</p>
                <h2 style="color: #22c55e; margin: 10px 0;">₹${totalAmount.toLocaleString()}</h2>
                <p style="color: #9ca3af; font-size: 12px;">Refund will appear in 5-7 business days</p>
            </div>
            
            <p>We're sorry this didn't work out. We hope to see you in future drops!</p>
            
            <p style="color: #9ca3af;">Order #${orderNumber}</p>
        </div>
    </div>
</body>
</html>
            `
        });
        return { success: true };
    } catch (error) {
        console.error("Refund email failed:", error);
        return { success: false, error };
    }
}
