CREATE TYPE "public"."audit_action" AS ENUM('user_created', 'user_updated', 'role_granted', 'role_revoked', 'clearance_set', 'permission_granted', 'permission_revoked', 'document_uploaded', 'document_published', 'document_superseded', 'capital_notice_created', 'capital_notice_approved', 'capital_notice_sent', 'banking_change_requested', 'banking_change_verified', 'banking_change_rejected', 'login_success', 'login_failed', 'session_expired');--> statement-breakpoint
CREATE TYPE "public"."banking_request_type" AS ENUM('add', 'change', 'remove');--> statement-breakpoint
CREATE TYPE "public"."banking_verification_status" AS ENUM('pending_callback', 'callback_scheduled', 'verified', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."capital_notice_status" AS ENUM('draft', 'pending_coo_approval', 'approved', 'sent');--> statement-breakpoint
CREATE TYPE "public"."capital_notice_type" AS ENUM('capital_call', 'distribution');--> statement-breakpoint
CREATE TYPE "public"."clearance_status" AS ENUM('pending', 'cleared', 'cleared_with_conditions', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."document_publish_status" AS ENUM('draft', 'pending_review', 'pending_approval', 'published', 'superseded');--> statement-breakpoint
CREATE TYPE "public"."document_sensitivity" AS ENUM('standard', 'high');--> statement-breakpoint
CREATE TYPE "public"."legal_entity_type" AS ENUM('individual', 'entity');--> statement-breakpoint
CREATE TYPE "public"."ticket_category" AS ENUM('credentials', 'documents', 'profile', 'banking', 'investment', 'other');--> statement-breakpoint
CREATE TYPE "public"."ticket_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."ticket_status" AS ENUM('open', 'in_progress', 'pending_user', 'resolved', 'closed');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('portal_admin', 'compliance_lead', 'compliance_reviewer', 'ir_lead', 'ir_publisher', 'head_capital_markets', 'coo', 'investor');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"action" "audit_action" NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"previous_value" jsonb,
	"new_value" jsonb,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "authorized_signatory" (
	"id" text PRIMARY KEY NOT NULL,
	"onboarding_id" text NOT NULL,
	"full_name" text NOT NULL,
	"title" text,
	"email" text,
	"phone" text,
	"authorization_scope" text,
	"authorization_limit" double precision,
	"id_document_type" text,
	"id_document_number" text,
	"board_resolution_date" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "banking_verification" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"request_type" "banking_request_type" NOT NULL,
	"bank_name" text NOT NULL,
	"account_holder_name" text NOT NULL,
	"account_number_last4" text,
	"routing_number" text,
	"account_type" text,
	"swift_bic" text,
	"status" "banking_verification_status" DEFAULT 'pending_callback' NOT NULL,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"request_ip_address" text,
	"callback_scheduled_at" timestamp,
	"callback_phone_number" text,
	"callback_attempts" jsonb,
	"verified_by" text,
	"verified_at" timestamp,
	"verification_notes" text,
	"rejected_by" text,
	"rejected_at" timestamp,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "beneficial_owner" (
	"id" text PRIMARY KEY NOT NULL,
	"onboarding_id" text NOT NULL,
	"full_name" text NOT NULL,
	"date_of_birth" text,
	"nationality" text,
	"country_of_residence" text,
	"ownership_percentage" double precision NOT NULL,
	"control_type" text,
	"address_line_1" text,
	"address_line_2" text,
	"city" text,
	"state_province" text,
	"postal_code" text,
	"country" text,
	"id_document_type" text,
	"id_document_number" text,
	"id_expiry_date" text,
	"is_pep" boolean DEFAULT false,
	"pep_details" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "capital_notice" (
	"id" text PRIMARY KEY NOT NULL,
	"deal_id" text NOT NULL,
	"type" "capital_notice_type" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"total_amount" double precision NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"due_date" timestamp,
	"distribution_date" timestamp,
	"status" "capital_notice_status" DEFAULT 'draft' NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"approved_by" text,
	"approved_at" timestamp,
	"approval_notes" text,
	"sent_at" timestamp,
	"sent_by" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "capital_notice_recipient" (
	"id" text PRIMARY KEY NOT NULL,
	"notice_id" text NOT NULL,
	"user_id" text NOT NULL,
	"amount" double precision NOT NULL,
	"email_sent_at" timestamp,
	"email_delivered_at" timestamp,
	"email_bounced_at" timestamp,
	"read_at" timestamp,
	"read_ip_address" text,
	"responded_at" timestamp,
	"response" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deal_document" (
	"id" text PRIMARY KEY NOT NULL,
	"deal_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"document_category" text,
	"current_version_id" text,
	"sensitivity" "document_sensitivity" DEFAULT 'standard' NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_version" (
	"id" text PRIMARY KEY NOT NULL,
	"document_id" text NOT NULL,
	"version_number" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size" text NOT NULL,
	"file_type" text NOT NULL,
	"file_path" text,
	"file_url" text,
	"status" "document_publish_status" DEFAULT 'draft' NOT NULL,
	"uploaded_by" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"review_notes" text,
	"approved_by" text,
	"approved_at" timestamp,
	"published_at" timestamp,
	"published_by" text,
	"superseded_at" timestamp,
	"superseded_by" text,
	"superseded_by_version_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_visibility" (
	"id" text PRIMARY KEY NOT NULL,
	"document_version_id" text NOT NULL,
	"visibility_type" text NOT NULL,
	"user_ids" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evidence_export" (
	"id" text PRIMARY KEY NOT NULL,
	"export_type" text NOT NULL,
	"export_path" text NOT NULL,
	"exported_by" text,
	"exported_at" timestamp DEFAULT now() NOT NULL,
	"period_start" timestamp,
	"period_end" timestamp,
	"retention_years" text DEFAULT '7' NOT NULL,
	"expires_at" timestamp,
	"file_size" text,
	"checksum" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investor_clearance" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"status" "clearance_status" DEFAULT 'pending' NOT NULL,
	"conditions" text,
	"conditions_json" jsonb,
	"cleared_by" text,
	"cleared_at" timestamp,
	"notes" text,
	"investor_visible_notes" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kyc_attestation" (
	"id" text PRIMARY KEY NOT NULL,
	"onboarding_id" text NOT NULL,
	"accuracy_attested" boolean DEFAULT false NOT NULL,
	"accuracy_attested_at" timestamp,
	"sanctions_declaration_attested" boolean DEFAULT false NOT NULL,
	"sanctions_declaration_attested_at" timestamp,
	"data_consent_attested" boolean DEFAULT false NOT NULL,
	"data_consent_attested_at" timestamp,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_ticket" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"category" "ticket_category" NOT NULL,
	"subject" text NOT NULL,
	"description" text NOT NULL,
	"status" "ticket_status" DEFAULT 'open' NOT NULL,
	"priority" "ticket_priority" DEFAULT 'medium' NOT NULL,
	"assigned_to" text,
	"assigned_at" timestamp,
	"resolved_by" text,
	"resolved_at" timestamp,
	"resolution" text,
	"closed_at" timestamp,
	"closed_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_ticket_comment" (
	"id" text PRIMARY KEY NOT NULL,
	"ticket_id" text NOT NULL,
	"user_id" text NOT NULL,
	"content" text NOT NULL,
	"is_internal" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_role_assignment" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"role" "user_role" NOT NULL,
	"granted_by" text,
	"granted_at" timestamp DEFAULT now() NOT NULL,
	"revoked_at" timestamp,
	"revoked_by" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_permission" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"deal_id" text NOT NULL,
	"can_view_teaser" boolean DEFAULT true NOT NULL,
	"can_view_documents" boolean DEFAULT false NOT NULL,
	"can_express_interest" boolean DEFAULT false NOT NULL,
	"can_invest" boolean DEFAULT false NOT NULL,
	"granted_by" text,
	"granted_at" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"revoked_at" timestamp,
	"revoked_by" text,
	"revoke_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "onboarding" ADD COLUMN "legal_entity_type" "legal_entity_type";--> statement-breakpoint
ALTER TABLE "onboarding" ADD COLUMN "pep_status" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "onboarding" ADD COLUMN "pep_details" text;--> statement-breakpoint
ALTER TABLE "onboarding" ADD COLUMN "source_of_wealth_narrative" text;--> statement-breakpoint
ALTER TABLE "onboarding" ADD COLUMN "accuracy_attestation" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "onboarding" ADD COLUMN "sanctions_declaration" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "onboarding" ADD COLUMN "data_consent" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authorized_signatory" ADD CONSTRAINT "authorized_signatory_onboarding_id_onboarding_id_fk" FOREIGN KEY ("onboarding_id") REFERENCES "public"."onboarding"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banking_verification" ADD CONSTRAINT "banking_verification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banking_verification" ADD CONSTRAINT "banking_verification_verified_by_user_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banking_verification" ADD CONSTRAINT "banking_verification_rejected_by_user_id_fk" FOREIGN KEY ("rejected_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "beneficial_owner" ADD CONSTRAINT "beneficial_owner_onboarding_id_onboarding_id_fk" FOREIGN KEY ("onboarding_id") REFERENCES "public"."onboarding"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capital_notice" ADD CONSTRAINT "capital_notice_deal_id_deal_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deal"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capital_notice" ADD CONSTRAINT "capital_notice_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capital_notice" ADD CONSTRAINT "capital_notice_approved_by_user_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capital_notice" ADD CONSTRAINT "capital_notice_sent_by_user_id_fk" FOREIGN KEY ("sent_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capital_notice_recipient" ADD CONSTRAINT "capital_notice_recipient_notice_id_capital_notice_id_fk" FOREIGN KEY ("notice_id") REFERENCES "public"."capital_notice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capital_notice_recipient" ADD CONSTRAINT "capital_notice_recipient_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_document" ADD CONSTRAINT "deal_document_deal_id_deal_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deal"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_document" ADD CONSTRAINT "deal_document_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_version" ADD CONSTRAINT "document_version_document_id_deal_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."deal_document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_version" ADD CONSTRAINT "document_version_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_version" ADD CONSTRAINT "document_version_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_version" ADD CONSTRAINT "document_version_approved_by_user_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_version" ADD CONSTRAINT "document_version_published_by_user_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_version" ADD CONSTRAINT "document_version_superseded_by_user_id_fk" FOREIGN KEY ("superseded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_visibility" ADD CONSTRAINT "document_visibility_document_version_id_document_version_id_fk" FOREIGN KEY ("document_version_id") REFERENCES "public"."document_version"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_export" ADD CONSTRAINT "evidence_export_exported_by_user_id_fk" FOREIGN KEY ("exported_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investor_clearance" ADD CONSTRAINT "investor_clearance_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investor_clearance" ADD CONSTRAINT "investor_clearance_cleared_by_user_id_fk" FOREIGN KEY ("cleared_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyc_attestation" ADD CONSTRAINT "kyc_attestation_onboarding_id_onboarding_id_fk" FOREIGN KEY ("onboarding_id") REFERENCES "public"."onboarding"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_ticket" ADD CONSTRAINT "service_ticket_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_ticket" ADD CONSTRAINT "service_ticket_assigned_to_user_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_ticket" ADD CONSTRAINT "service_ticket_resolved_by_user_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_ticket" ADD CONSTRAINT "service_ticket_closed_by_user_id_fk" FOREIGN KEY ("closed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_ticket_comment" ADD CONSTRAINT "service_ticket_comment_ticket_id_service_ticket_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."service_ticket"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_ticket_comment" ADD CONSTRAINT "service_ticket_comment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role_assignment" ADD CONSTRAINT "user_role_assignment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role_assignment" ADD CONSTRAINT "user_role_assignment_granted_by_user_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role_assignment" ADD CONSTRAINT "user_role_assignment_revoked_by_user_id_fk" FOREIGN KEY ("revoked_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_permission" ADD CONSTRAINT "vehicle_permission_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_permission" ADD CONSTRAINT "vehicle_permission_deal_id_deal_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deal"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_permission" ADD CONSTRAINT "vehicle_permission_granted_by_user_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_permission" ADD CONSTRAINT "vehicle_permission_revoked_by_user_id_fk" FOREIGN KEY ("revoked_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_userId_idx" ON "audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_log_action_idx" ON "audit_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_log_targetType_idx" ON "audit_log" USING btree ("target_type");--> statement-breakpoint
CREATE INDEX "audit_log_targetId_idx" ON "audit_log" USING btree ("target_id");--> statement-breakpoint
CREATE INDEX "audit_log_createdAt_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "authorized_signatory_onboardingId_idx" ON "authorized_signatory" USING btree ("onboarding_id");--> statement-breakpoint
CREATE INDEX "banking_verification_userId_idx" ON "banking_verification" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "banking_verification_status_idx" ON "banking_verification" USING btree ("status");--> statement-breakpoint
CREATE INDEX "beneficial_owner_onboardingId_idx" ON "beneficial_owner" USING btree ("onboarding_id");--> statement-breakpoint
CREATE INDEX "capital_notice_dealId_idx" ON "capital_notice" USING btree ("deal_id");--> statement-breakpoint
CREATE INDEX "capital_notice_status_idx" ON "capital_notice" USING btree ("status");--> statement-breakpoint
CREATE INDEX "capital_notice_type_idx" ON "capital_notice" USING btree ("type");--> statement-breakpoint
CREATE INDEX "capital_notice_recipient_noticeId_idx" ON "capital_notice_recipient" USING btree ("notice_id");--> statement-breakpoint
CREATE INDEX "capital_notice_recipient_userId_idx" ON "capital_notice_recipient" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "deal_document_dealId_idx" ON "deal_document" USING btree ("deal_id");--> statement-breakpoint
CREATE INDEX "deal_document_category_idx" ON "deal_document" USING btree ("document_category");--> statement-breakpoint
CREATE INDEX "document_version_documentId_idx" ON "document_version" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "document_version_status_idx" ON "document_version" USING btree ("status");--> statement-breakpoint
CREATE INDEX "document_visibility_versionId_idx" ON "document_visibility" USING btree ("document_version_id");--> statement-breakpoint
CREATE INDEX "evidence_export_type_idx" ON "evidence_export" USING btree ("export_type");--> statement-breakpoint
CREATE INDEX "evidence_export_exportedAt_idx" ON "evidence_export" USING btree ("exported_at");--> statement-breakpoint
CREATE INDEX "investor_clearance_userId_idx" ON "investor_clearance" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "investor_clearance_status_idx" ON "investor_clearance" USING btree ("status");--> statement-breakpoint
CREATE INDEX "kyc_attestation_onboardingId_idx" ON "kyc_attestation" USING btree ("onboarding_id");--> statement-breakpoint
CREATE INDEX "service_ticket_userId_idx" ON "service_ticket" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "service_ticket_status_idx" ON "service_ticket" USING btree ("status");--> statement-breakpoint
CREATE INDEX "service_ticket_assignedTo_idx" ON "service_ticket" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "service_ticket_category_idx" ON "service_ticket" USING btree ("category");--> statement-breakpoint
CREATE INDEX "service_ticket_comment_ticketId_idx" ON "service_ticket_comment" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "service_ticket_comment_userId_idx" ON "service_ticket_comment" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_role_assignment_userId_idx" ON "user_role_assignment" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_role_assignment_role_idx" ON "user_role_assignment" USING btree ("role");--> statement-breakpoint
CREATE INDEX "vehicle_permission_userId_idx" ON "vehicle_permission" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "vehicle_permission_dealId_idx" ON "vehicle_permission" USING btree ("deal_id");