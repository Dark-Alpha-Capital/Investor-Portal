CREATE TYPE "public"."document_status" AS ENUM('pending', 'approved', 'rejected', 'incorrect_doc', 'needs_revision');--> statement-breakpoint
ALTER TABLE "onboarding_document" ADD COLUMN "status" "document_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "onboarding_document" ADD COLUMN "reviewed_at" timestamp;--> statement-breakpoint
ALTER TABLE "onboarding_document" ADD COLUMN "reviewed_by" text;
