ALTER TABLE "deal" ALTER COLUMN "target_raise" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "deal" ALTER COLUMN "min_investment" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "deal" ALTER COLUMN "target_irr" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "deal" ALTER COLUMN "target_moic" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "deal_interest" ALTER COLUMN "proposed_amount" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "investment" ALTER COLUMN "committed_amount" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "investment" ALTER COLUMN "funded_amount" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "investment" ALTER COLUMN "current_value" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "investment" ALTER COLUMN "distributions" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "investment" ALTER COLUMN "ownership_percentage" SET DATA TYPE double precision;