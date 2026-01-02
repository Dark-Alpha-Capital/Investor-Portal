ALTER TYPE "public"."audit_action" ADD VALUE 'ticket_created';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'ticket_assigned';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'ticket_status_changed';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'ticket_commented';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'ticket_resolved';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'ticket_closed';