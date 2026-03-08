CREATE TYPE "public"."outbox_status" AS ENUM('pending', 'processing', 'dispatched', 'failed');--> statement-breakpoint
CREATE TABLE "side_effect_outbox" (
	"id" text PRIMARY KEY NOT NULL,
	"topic" text NOT NULL,
	"dedupe_key" text NOT NULL,
	"payload" jsonb NOT NULL,
	"status" "outbox_status" DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"dispatched_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "side_effect_outbox_dedupe_key_unique" UNIQUE("dedupe_key")
);
--> statement-breakpoint
CREATE INDEX "side_effect_outbox_status_idx" ON "side_effect_outbox" USING btree ("status");--> statement-breakpoint
CREATE INDEX "side_effect_outbox_created_at_idx" ON "side_effect_outbox" USING btree ("created_at");