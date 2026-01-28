CREATE TABLE "onboarding_edit_history" (
	"id" text PRIMARY KEY NOT NULL,
	"onboarding_id" text NOT NULL,
	"user_id" text NOT NULL,
	"field_name" text NOT NULL,
	"field_label" text,
	"previous_value" text,
	"new_value" text,
	"edited_at" timestamp DEFAULT now() NOT NULL,
	"edit_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "onboarding" ADD COLUMN "last_edited_at" timestamp;--> statement-breakpoint
ALTER TABLE "onboarding" ADD COLUMN "last_edited_by" text;--> statement-breakpoint
ALTER TABLE "onboarding" ADD COLUMN "edit_count" text DEFAULT '0';--> statement-breakpoint
ALTER TABLE "onboarding" ADD COLUMN "is_editable" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "onboarding_edit_history" ADD CONSTRAINT "onboarding_edit_history_onboarding_id_onboarding_id_fk" FOREIGN KEY ("onboarding_id") REFERENCES "public"."onboarding"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_edit_history" ADD CONSTRAINT "onboarding_edit_history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "onboarding_edit_history_onboardingId_idx" ON "onboarding_edit_history" USING btree ("onboarding_id");--> statement-breakpoint
CREATE INDEX "onboarding_edit_history_userId_idx" ON "onboarding_edit_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "onboarding_edit_history_editedAt_idx" ON "onboarding_edit_history" USING btree ("edited_at");