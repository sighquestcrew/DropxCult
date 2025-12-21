import { Resend } from 'resend';

// Initialize Resend with API key (gracefully handle missing key)
const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

// From email (use your verified domain or resend.dev for testing)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'DropXCult <onboarding@resend.dev>';

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
    // Skip email if Resend is not configured
    if (!resend) {
        console.warn('[Email] Resend API key not configured. Skipping email to:', to);
        return { success: false, error: 'Email service not configured' };
    }

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
