import { Resend } from 'resend';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// From email (use your verified domain or resend.dev for testing)
const FROM_EMAIL = 'DropXCult <onboarding@resend.dev>';

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
    try {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to,
            subject,
            html,
        });

        if (error) {
            console.error('Email send error:', error);
            return { success: false, error };
        }

        console.log('Email sent:', data?.id);
        return { success: true, id: data?.id };
    } catch (error) {
        console.error('Email error:', error);
        return { success: false, error };
    }
}

// Order Confirmation Email
export async function sendOrderConfirmation(order: {
    orderId: string;
    customerName: string;
    customerEmail: string;
    items: { name: string; size: string; qty: number; price: number }[];
    total: number;
    address: string;
}) {
    const itemsHtml = order.items.map(item => `
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #333;">${item.name}</td>
            <td style="padding: 12px; border-bottom: 1px solid #333;">${item.size}</td>
            <td style="padding: 12px; border-bottom: 1px solid #333;">${item.qty}</td>
            <td style="padding: 12px; border-bottom: 1px solid #333;">₹${item.price}</td>
        </tr>
    `).join('');

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border-radius: 12px; overflow: hidden; border: 1px solid #333;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #dc2626 0%, #7c3aed 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🔥 DropXCult</h1>
                <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0; font-size: 14px;">Order Confirmed!</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px; color: #e5e5e5;">
                <h2 style="color: white; margin: 0 0 20px 0;">Hey ${order.customerName}! 👋</h2>
                <p style="line-height: 1.6; margin: 0 0 20px 0;">
                    Thanks for your order! We've received it and are getting it ready. 
                    Custom designs take 3-5 days to print before shipping.
                </p>
                
                <div style="background-color: #262626; border-radius: 8px; padding: 16px; margin: 20px 0;">
                    <p style="margin: 0; color: #a3a3a3;">Order ID</p>
                    <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold; color: #dc2626; font-family: monospace;">
                        #${order.orderId.substring(0, 8).toUpperCase()}
                    </p>
                </div>
                
                <!-- Order Items -->
                <h3 style="color: white; margin: 30px 0 15px 0; border-bottom: 1px solid #333; padding-bottom: 10px;">Order Details</h3>
                <table style="width: 100%; border-collapse: collapse; color: #e5e5e5;">
                    <thead>
                        <tr style="text-align: left; color: #a3a3a3;">
                            <th style="padding: 12px; border-bottom: 2px solid #333;">Item</th>
                            <th style="padding: 12px; border-bottom: 2px solid #333;">Size</th>
                            <th style="padding: 12px; border-bottom: 2px solid #333;">Qty</th>
                            <th style="padding: 12px; border-bottom: 2px solid #333;">Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3" style="padding: 15px 12px; font-weight: bold; color: white;">Total</td>
                            <td style="padding: 15px 12px; font-weight: bold; color: #22c55e; font-size: 18px;">₹${order.total}</td>
                        </tr>
                    </tfoot>
                </table>
                
                <!-- Shipping -->
                <h3 style="color: white; margin: 30px 0 15px 0; border-bottom: 1px solid #333; padding-bottom: 10px;">Shipping To</h3>
                <p style="color: #a3a3a3; line-height: 1.6; margin: 0;">${order.address}</p>
                
                <!-- Footer -->
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #333; text-align: center;">
                    <p style="color: #666; font-size: 12px; margin: 0;">
                        Questions? Reply to this email or contact us at support@dropxcult.com
                    </p>
                    <p style="color: #666; font-size: 12px; margin: 10px 0 0 0;">
                        © 2024 DropXCult. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    return sendEmail({
        to: order.customerEmail,
        subject: `Order Confirmed! #${order.orderId.substring(0, 8).toUpperCase()} 🛍️`,
        html,
    });
}

// Design Status Email
export async function sendDesignStatusEmail(design: {
    designName: string;
    designerName: string;
    designerEmail: string;
    status: 'Accepted' | 'Rejected';
    message?: string;
}) {
    const isAccepted = design.status === 'Accepted';

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border-radius: 12px; overflow: hidden; border: 1px solid #333;">
            <!-- Header -->
            <div style="background: ${isAccepted ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)'}; padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🔥 DropXCult</h1>
                <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0; font-size: 14px;">Design ${design.status}</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px; color: #e5e5e5;">
                <h2 style="color: white; margin: 0 0 20px 0;">Hey ${design.designerName}! 👋</h2>
                
                <div style="background-color: #262626; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                    <p style="margin: 0; color: #a3a3a3; font-size: 14px;">Your design</p>
                    <p style="margin: 10px 0; font-size: 24px; font-weight: bold; color: white;">"${design.designName}"</p>
                    <span style="display: inline-block; padding: 8px 20px; border-radius: 50px; font-weight: bold; ${isAccepted ? 'background-color: #166534; color: #22c55e;' : 'background-color: #7f1d1d; color: #ef4444;'}">
                        ${isAccepted ? '✓ ACCEPTED' : '✗ REJECTED'}
                    </span>
                </div>
                
                ${isAccepted ? `
                <p style="line-height: 1.6; margin: 20px 0;">
                    🎉 <strong>Congratulations!</strong> Your design has been approved and is now live in our shop! 
                    You may be eligible for royalties if someone purchases your design.
                </p>
                <a href="https://dropxcult.com/community" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #7c3aed 100%); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 10px 0;">
                    View in Community
                </a>
                ` : `
                <p style="line-height: 1.6; margin: 20px 0;">
                    We appreciate your creativity! Unfortunately, this design didn't meet our guidelines. 
                    ${design.message ? `<br><br><strong>Feedback:</strong> ${design.message}` : ''}
                </p>
                <p style="line-height: 1.6; margin: 20px 0;">
                    Don't give up! Feel free to submit another design. We'd love to see more of your work.
                </p>
                <a href="https://dropxcult.com/customize" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #7c3aed 100%); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 10px 0;">
                    Create New Design
                </a>
                `}
                
                <!-- Footer -->
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #333; text-align: center;">
                    <p style="color: #666; font-size: 12px; margin: 0;">
                        © 2024 DropXCult. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    return sendEmail({
        to: design.designerEmail,
        subject: `Design ${design.status}: "${design.designName}" ${isAccepted ? '🎉' : ''}`,
        html,
    });
}

// Shipping Notification Email
export async function sendShippingNotification(order: {
    orderId: string;
    customerName: string;
    customerEmail: string;
    trackingId?: string;
    courierName?: string;
}) {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border-radius: 12px; overflow: hidden; border: 1px solid #333;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">📦 Order Shipped!</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px; color: #e5e5e5;">
                <h2 style="color: white; margin: 0 0 20px 0;">Hey ${order.customerName}! 👋</h2>
                <p style="line-height: 1.6; margin: 0 0 20px 0;">
                    Great news! Your order is on its way. Here are your tracking details:
                </p>
                
                <div style="background-color: #262626; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <div style="margin-bottom: 15px;">
                        <p style="margin: 0; color: #a3a3a3; font-size: 12px;">ORDER ID</p>
                        <p style="margin: 5px 0 0 0; font-weight: bold; color: white; font-family: monospace;">
                            #${order.orderId.substring(0, 8).toUpperCase()}
                        </p>
                    </div>
                    ${order.trackingId ? `
                    <div style="margin-bottom: 15px;">
                        <p style="margin: 0; color: #a3a3a3; font-size: 12px;">TRACKING ID</p>
                        <p style="margin: 5px 0 0 0; font-weight: bold; color: #3b82f6; font-family: monospace;">
                            ${order.trackingId}
                        </p>
                    </div>
                    ` : ''}
                    ${order.courierName ? `
                    <div>
                        <p style="margin: 0; color: #a3a3a3; font-size: 12px;">COURIER</p>
                        <p style="margin: 5px 0 0 0; font-weight: bold; color: white;">
                            ${order.courierName}
                        </p>
                    </div>
                    ` : ''}
                </div>
                
                <p style="line-height: 1.6; color: #a3a3a3;">
                    Expected delivery: <strong style="color: white;">3-5 business days</strong>
                </p>
                
                <!-- Footer -->
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #333; text-align: center;">
                    <p style="color: #666; font-size: 12px; margin: 0;">
                        © 2024 DropXCult. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    return sendEmail({
        to: order.customerEmail,
        subject: `Your Order is Shipped! 📦 #${order.orderId.substring(0, 8).toUpperCase()}`,
        html,
    });
}
