import prisma from "@/lib/prisma";
import { headers } from "next/headers";

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
        // Get request headers for IP and User-Agent
        let ipAddress: string | undefined;
        let userAgent: string | undefined;

        try {
            const headersList = await headers();
            ipAddress = headersList.get("x-forwarded-for")
                || headersList.get("x-real-ip")
                || undefined;
            userAgent = headersList.get("user-agent") || undefined;
        } catch {
            // Headers not available (e.g., called outside request context)
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
        // Don't throw - audit logging should never break the main flow
        console.error("Failed to log audit event:", error);
    }
}

/**
 * Helper to extract user info from JWT token for audit logging
 */
export function extractAuditUser(decoded: { _id: string; email?: string; isAdmin?: boolean }) {
    return {
        userId: decoded._id,
        userEmail: decoded.email,
        userRole: decoded.isAdmin ? "admin" as const : "user" as const,
    };
}
