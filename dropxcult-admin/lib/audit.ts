import prisma from "@/lib/prisma";
import { headers } from "next/headers";

// Define audit log types based on Prisma schema
export type AuditAction =
    | "LOGIN" | "LOGOUT" | "LOGIN_FAILED" | "REGISTER"
    | "CREATE" | "READ" | "UPDATE" | "DELETE"
    | "APPROVE" | "REJECT" | "STATUS_CHANGE"
    | "PAYMENT" | "REFUND";

export type AuditEntity =
    | "User" | "Order" | "Product" | "Design" | "CustomRequest";

export type AuditStatus = "SUCCESS" | "FAILURE" | "DENIED";

interface AuditEvent {
    userId?: string;
    userEmail?: string;
    userRole?: "user" | "admin";
    action: AuditAction;
    entity: AuditEntity;
    entityId?: string;
    details?: Record<string, any>;
    status?: AuditStatus;
    errorMessage?: string;
}

/**
 * Log an audit event for compliance tracking
 */
export async function logAudit(event: AuditEvent): Promise<void> {
    try {
        let ipAddress: string | undefined;
        let userAgent: string | undefined;

        try {
            const headersList = await headers();
            ipAddress = headersList.get("x-forwarded-for")
                || headersList.get("x-real-ip")
                || undefined;
            userAgent = headersList.get("user-agent") || undefined;
        } catch {
            // Headers not available
        }

        await prisma.auditLog.create({
            data: {
                userId: event.userId,
                userEmail: event.userEmail,
                userRole: event.userRole,
                action: event.action,
                entity: event.entity,
                entityId: event.entityId,
                details: event.details,
                status: event.status || "SUCCESS",
                errorMessage: event.errorMessage,
                ipAddress,
                userAgent,
            },
        });
    } catch (error) {
        console.error("Failed to log audit event:", error);
    }
}
