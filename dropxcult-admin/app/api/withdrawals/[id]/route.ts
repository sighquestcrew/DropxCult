import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { processPayout } from "@/lib/razorpay-payout";

/**
 * PATCH - Approve or reject withdrawal request (Admin only)
 * When approved, automatically triggers Razorpay Payout
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { action, adminNote, transactionId, skipPayout } = body;

        // Get the request
        const request = await prisma.withdrawalRequest.findUnique({
            where: { id }
        });

        if (!request) {
            return NextResponse.json({ error: "Request not found" }, { status: 404 });
        }

        if (request.status !== "pending") {
            return NextResponse.json(
                { error: `Request is already ${request.status}` },
                { status: 400 }
            );
        }

        if (action === "approve") {
            let payoutResult = null;
            let finalTransactionId = transactionId;

            // Try to process payout via Razorpay (unless skipped or manual transaction ID provided)
            if (!skipPayout && !transactionId) {
                payoutResult = await processPayout({
                    amount: request.amount,
                    accountName: request.accountName,
                    accountNumber: request.accountNumber,
                    ifscCode: request.ifscCode,
                    referenceId: id,
                });

                if (payoutResult.success) {
                    finalTransactionId = payoutResult.transactionId || payoutResult.payoutId;
                } else {
                    // Payout failed - return error but don't mark as approved
                    return NextResponse.json({
                        error: "Payout failed",
                        details: payoutResult.error,
                        hint: "You can manually enter a transaction ID and try again, or skip automatic payout"
                    }, { status: 400 });
                }
            }

            // Update request as processed
            await prisma.withdrawalRequest.update({
                where: { id },
                data: {
                    status: "processed",
                    adminNote: adminNote || (payoutResult?.success ? "Auto-processed via Razorpay" : "Manually approved"),
                    processedBy: "admin",
                    processedAt: new Date(),
                    transactionId: finalTransactionId || null
                }
            });

            return NextResponse.json({
                message: payoutResult?.success
                    ? "Withdrawal approved and payout initiated via Razorpay"
                    : "Withdrawal approved (manual processing)",
                request: {
                    id,
                    status: "processed",
                    transactionId: finalTransactionId,
                    payoutStatus: payoutResult?.status
                }
            });

        } else if (action === "reject") {
            // Reject and return points to user
            await prisma.$transaction(async (tx) => {
                await tx.user.update({
                    where: { id: request.userId },
                    data: { royaltyPoints: { increment: request.amount } }
                });

                await tx.withdrawalRequest.update({
                    where: { id },
                    data: {
                        status: "rejected",
                        adminNote: adminNote || "Request rejected",
                        processedBy: "admin",
                        processedAt: new Date()
                    }
                });
            });

            return NextResponse.json({
                message: "Withdrawal request rejected, points returned to user",
                request: { id, status: "rejected" }
            });

        } else {
            return NextResponse.json(
                { error: "Invalid action. Use 'approve' or 'reject'" },
                { status: 400 }
            );
        }

    } catch (error: any) {
        console.error("Process withdrawal request error:", error);
        return NextResponse.json(
            { error: "Failed to process request", details: error.message },
            { status: 500 }
        );
    }
}
