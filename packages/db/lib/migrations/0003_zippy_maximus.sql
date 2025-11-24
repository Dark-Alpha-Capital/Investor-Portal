CREATE TYPE "public"."onboarding_status" AS ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected', 'needs_more_info');--> statement-breakpoint
CREATE TABLE "onboarding" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"organization_name" text NOT NULL,
	"primary_contact_name" text NOT NULL,
	"primary_contact_title" text,
	"primary_contact_email" text NOT NULL,
	"primary_contact_phone" text NOT NULL,
	"capital_provider_type" text NOT NULL,
	"investor_type" text NOT NULL,
	"geographic_focus" text,
	"open_to_emerging_sponsor" text NOT NULL,
	"minimum_requirements" text,
	"prior_deal_attribution" text NOT NULL,
	"prior_deal_attribution_explanation" text,
	"nda_preference" text NOT NULL,
	"nda_limitations" text,
	"timing_to_loi" text NOT NULL,
	"timing_to_commitment" text NOT NULL,
	"timing_drivers" text,
	"economics_description" text NOT NULL,
	"preferred_role" text NOT NULL,
	"governance_expectations" text,
	"provide_support_letter" text NOT NULL,
	"join_broker_conversations" text NOT NULL,
	"support_letter_stages" jsonb NOT NULL,
	"receive_updates" text NOT NULL,
	"update_frequency" text,
	"update_format" jsonb,
	"industry_preferences" text,
	"equity_check_size" text NOT NULL,
	"enterprise_value_range" text,
	"ebitda_range" text,
	"preferred_ownership" text NOT NULL,
	"typical_hold_period" text,
	"transaction_types" jsonb NOT NULL,
	"leverage_tolerance" text,
	"revenue_characteristics" text NOT NULL,
	"customer_concentration" text,
	"margins_and_cash_flow" text,
	"asset_profile" text NOT NULL,
	"management_involvement" text,
	"sectors_of_interest" text NOT NULL,
	"sectors_to_avoid" text,
	"deal_size_thresholds" text,
	"specific_themes" text,
	"status" "onboarding_status" DEFAULT 'draft' NOT NULL,
	"submitted_at" timestamp,
	"reviewed_at" timestamp,
	"reviewed_by" text,
	"review_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "onboarding_document" (
	"id" text PRIMARY KEY NOT NULL,
	"onboarding_id" text NOT NULL,
	"document_type" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size" text NOT NULL,
	"file_type" text NOT NULL,
	"file_url" text,
	"file_path" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "onboarding" ADD CONSTRAINT "onboarding_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_document" ADD CONSTRAINT "onboarding_document_onboarding_id_onboarding_id_fk" FOREIGN KEY ("onboarding_id") REFERENCES "public"."onboarding"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "onboarding_userId_idx" ON "onboarding" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "onboarding_status_idx" ON "onboarding" USING btree ("status");--> statement-breakpoint
CREATE INDEX "onboarding_submittedAt_idx" ON "onboarding" USING btree ("submitted_at");--> statement-breakpoint
CREATE INDEX "onboarding_document_onboardingId_idx" ON "onboarding_document" USING btree ("onboarding_id");--> statement-breakpoint
CREATE INDEX "onboarding_document_documentType_idx" ON "onboarding_document" USING btree ("document_type");