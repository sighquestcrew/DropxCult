/**
 * Razorpay Payout Service
 * Uses Razorpay Payouts X API for automatic bank transfers
 * 
 * IMPORTANT: Requires Razorpay Payouts X to be enabled on your account
 * Test mode uses rzp_test_ keys
 */

interface PayoutDetails {
    amount: number; // in INR (not paise)
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    referenceId: string; // withdrawal request ID
}

interface PayoutResponse {
    success: boolean;
    payoutId?: string;
    transactionId?: string;
    status?: string;
    error?: string;
}

const RAZORPAY_API_BASE = "https://api.razorpay.com/v1";

/**
 * Make authenticated request to Razorpay API
 */
async function razorpayRequest(endpoint: string, method: string, body?: any) {
    const auth = Buffer.from(
        `${process.env.RAZORPAY_API_KEY}:${process.env.RAZORPAY_API_SECRET}`
    ).toString("base64");

    const response = await fetch(`${RAZORPAY_API_BASE}${endpoint}`, {
        method,
        headers: {
            "Authorization": `Basic ${auth}`,
            "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error?.description || "Razorpay API error");
    }

    return data;
}

/**
 * Create a contact (represents the user receiving payment)
 */
async function createContact(name: string, referenceId: string) {
    return razorpayRequest("/contacts", "POST", {
        name,
        type: "vendor",
        reference_id: referenceId,
    });
}

/**
 * Create a fund account (user's bank account)
 */
async function createFundAccount(
    contactId: string,
    accountName: string,
    accountNumber: string,
    ifscCode: string
) {
    return razorpayRequest("/fund_accounts", "POST", {
        contact_id: contactId,
        account_type: "bank_account",
        bank_account: {
            name: accountName,
            ifsc: ifscCode,
            account_number: accountNumber,
        },
    });
}

/**
 * Create a payout to the fund account
 */
async function createPayoutRequest(
    fundAccountId: string,
    amount: number,
    referenceId: string
) {
    // Note: RAZORPAY_ACCOUNT_NUMBER is your Razorpay X account number
    // For test mode, you may need to use a test account number
    return razorpayRequest("/payouts", "POST", {
        account_number: process.env.RAZORPAY_X_ACCOUNT_NUMBER || process.env.RAZORPAY_ACCOUNT_NUMBER,
        fund_account_id: fundAccountId,
        amount: amount * 100, // Convert to paise
        currency: "INR",
        mode: "IMPS",
        purpose: "payout",
        queue_if_low_balance: true,
        reference_id: referenceId,
        narration: "DropXCult Royalty Payout",
    });
}

/**
 * Main function to process a payout
 * Creates contact -> fund account -> payout
 */
export async function processPayout(details: PayoutDetails): Promise<PayoutResponse> {
    try {
        // Check if API keys are configured
        if (!process.env.RAZORPAY_API_KEY || !process.env.RAZORPAY_API_SECRET) {
            return {
                success: false,
                error: "Razorpay API keys not configured",
            };
        }

        // Step 1: Create contact
        const contact = await createContact(
            details.accountName,
            `withdrawal_${details.referenceId}`
        );

        // Step 2: Create fund account
        const fundAccount = await createFundAccount(
            contact.id,
            details.accountName,
            details.accountNumber,
            details.ifscCode
        );

        // Step 3: Create payout
        const payout = await createPayoutRequest(
            fundAccount.id,
            details.amount,
            details.referenceId
        );

        return {
            success: true,
            payoutId: payout.id,
            transactionId: payout.utr || payout.id, // UTR is bank reference
            status: payout.status,
        };

    } catch (error: any) {
        console.error("Payout Error:", error.message);
        return {
            success: false,
            error: error.message || "Payout processing failed",
        };
    }
}

/**
 * Check status of an existing payout
 */
export async function checkPayoutStatus(payoutId: string): Promise<PayoutResponse> {
    try {
        const payout = await razorpayRequest(`/payouts/${payoutId}`, "GET");
        return {
            success: true,
            payoutId: payout.id,
            transactionId: payout.utr,
            status: payout.status,
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message,
        };
    }
}
