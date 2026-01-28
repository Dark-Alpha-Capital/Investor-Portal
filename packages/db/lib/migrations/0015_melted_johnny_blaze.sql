DROP TABLE "service_ticket" CASCADE;--> statement-breakpoint
DROP TABLE "service_ticket_comment" CASCADE;--> statement-breakpoint
ALTER TABLE "audit_log" ALTER COLUMN "action" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."audit_action";--> statement-breakpoint
CREATE TYPE "public"."audit_action" AS ENUM('user_created', 'user_updated', 'role_granted', 'role_revoked', 'clearance_set', 'permission_granted', 'permission_revoked', 'document_uploaded', 'document_published', 'document_superseded', 'document_reviewed', 'capital_notice_created', 'capital_notice_approved', 'capital_notice_sent', 'banking_change_requested', 'banking_change_verified', 'banking_change_rejected', 'login_success', 'login_failed', 'session_expired');--> statement-breakpoint
ALTER TABLE "audit_log" ALTER COLUMN "action" SET DATA TYPE "public"."audit_action" USING "action"::"public"."audit_action";--> statement-breakpoint
DROP TYPE "public"."ticket_category";--> statement-breakpoint
DROP TYPE "public"."ticket_priority";--> statement-breakpoint
DROP TYPE "public"."ticket_status";