CREATE TYPE "public"."kyc_status" AS ENUM('review', 'approved', 'pending_docs', 'rejected');--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "kyc_status" "kyc_status" DEFAULT 'review' NOT NULL;