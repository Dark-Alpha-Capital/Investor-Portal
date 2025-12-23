ALTER TABLE "onboarding" ADD COLUMN "accreditation_status" text;--> statement-breakpoint
ALTER TABLE "onboarding" ADD COLUMN "accreditation_method" text;--> statement-breakpoint
ALTER TABLE "onboarding" ADD COLUMN "entity_tax_id" text;--> statement-breakpoint
ALTER TABLE "onboarding" ADD COLUMN "entity_signatory_name" text;--> statement-breakpoint
ALTER TABLE "onboarding" ADD COLUMN "entity_signatory_title" text;--> statement-breakpoint
ALTER TABLE "onboarding" ADD COLUMN "legal_documents_acknowledged" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "onboarding" ADD COLUMN "electronic_signature_name" text;--> statement-breakpoint
ALTER TABLE "onboarding" ADD COLUMN "electronic_signature_date" text;