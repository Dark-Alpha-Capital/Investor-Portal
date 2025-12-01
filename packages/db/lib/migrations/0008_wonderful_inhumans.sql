ALTER TABLE "investment" DROP CONSTRAINT IF EXISTS "investment_deal_id_deal_id_fk";
--> statement-breakpoint
ALTER TABLE "investment" DROP CONSTRAINT IF EXISTS "investment_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "investment" ADD CONSTRAINT "investment_deal_id_deal_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deal"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment" ADD CONSTRAINT "investment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_document" DROP COLUMN IF EXISTS "reviewed";