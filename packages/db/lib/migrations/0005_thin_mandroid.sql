CREATE TYPE "public"."deal_status" AS ENUM('draft', 'coming_soon', 'live', 'closing', 'funded', 'exited', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."deal_visibility" AS ENUM('public', 'accredited', 'invite_only');--> statement-breakpoint
CREATE TYPE "public"."interest_status" AS ENUM('interested', 'soft_committed', 'pass', 'meeting_requested');--> statement-breakpoint
CREATE TYPE "public"."investment_status" AS ENUM('committed', 'active', 'transferred', 'liquidated', 'written_off');--> statement-breakpoint
CREATE TABLE "deal" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text,
	"description" text,
	"teaser_summary" text,
	"sector" text,
	"geography" text,
	"deal_type" text,
	"target_raise" numeric(20, 2),
	"min_investment" numeric(20, 2),
	"target_irr" numeric(5, 2),
	"target_moic" numeric(5, 2),
	"status" "deal_status" DEFAULT 'draft' NOT NULL,
	"visibility" "deal_visibility" DEFAULT 'invite_only' NOT NULL,
	"cover_image_url" text,
	"launch_date" timestamp,
	"close_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "deal_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "deal_interest" (
	"id" text PRIMARY KEY NOT NULL,
	"deal_id" text NOT NULL,
	"user_id" text NOT NULL,
	"status" "interest_status" DEFAULT 'interested' NOT NULL,
	"proposed_amount" numeric(20, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "deal_invite" (
	"id" text PRIMARY KEY NOT NULL,
	"deal_id" text NOT NULL,
	"user_id" text NOT NULL,
	"curation_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investment" (
	"id" text PRIMARY KEY NOT NULL,
	"deal_id" text NOT NULL,
	"user_id" text NOT NULL,
	"committed_amount" numeric(20, 2) NOT NULL,
	"committed_date" timestamp NOT NULL,
	"funded_amount" numeric(20, 2) DEFAULT '0',
	"current_value" numeric(20, 2),
	"distributions" numeric(20, 2) DEFAULT '0',
	"status" "investment_status" DEFAULT 'active' NOT NULL,
	"ownership_percentage" numeric(10, 6),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "deal_interest" ADD CONSTRAINT "deal_interest_deal_id_deal_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deal"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_interest" ADD CONSTRAINT "deal_interest_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_invite" ADD CONSTRAINT "deal_invite_deal_id_deal_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deal"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_invite" ADD CONSTRAINT "deal_invite_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment" ADD CONSTRAINT "investment_deal_id_deal_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deal"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment" ADD CONSTRAINT "investment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "deal_invite_user_idx" ON "deal_invite" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "deal_invite_deal_idx" ON "deal_invite" USING btree ("deal_id");