CREATE TABLE "investment_document" (
	"id" text PRIMARY KEY NOT NULL,
	"investment_id" text NOT NULL,
	"document_type" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size" text NOT NULL,
	"file_type" text NOT NULL,
	"file_url" text,
	"file_path" text,
	"period_start" timestamp,
	"period_end" timestamp,
	"year" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "investment_document" ADD CONSTRAINT "investment_document_investment_id_investment_id_fk" FOREIGN KEY ("investment_id") REFERENCES "public"."investment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "investment_document_investmentId_idx" ON "investment_document" USING btree ("investment_id");--> statement-breakpoint
CREATE INDEX "investment_document_documentType_idx" ON "investment_document" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX "investment_document_year_idx" ON "investment_document" USING btree ("year");