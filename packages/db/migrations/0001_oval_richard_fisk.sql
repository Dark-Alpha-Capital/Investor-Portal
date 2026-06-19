PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_account`("id", "account_id", "provider_id", "user_id", "access_token", "refresh_token", "id_token", "access_token_expires_at", "refresh_token_expires_at", "scope", "password", "created_at", "updated_at") SELECT "id", "account_id", "provider_id", "user_id", "access_token", "refresh_token", "id_token", "access_token_expires_at", "refresh_token_expires_at", "scope", "password", "created_at", "updated_at" FROM `account`;--> statement-breakpoint
DROP TABLE `account`;--> statement-breakpoint
ALTER TABLE `__new_account` RENAME TO `account`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `__new_audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`action` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`previous_value` text,
	`new_value` text,
	`metadata` text,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_audit_log`("id", "user_id", "action", "target_type", "target_id", "previous_value", "new_value", "metadata", "ip_address", "user_agent", "created_at") SELECT "id", "user_id", "action", "target_type", "target_id", "previous_value", "new_value", "metadata", "ip_address", "user_agent", "created_at" FROM `audit_log`;--> statement-breakpoint
DROP TABLE `audit_log`;--> statement-breakpoint
ALTER TABLE `__new_audit_log` RENAME TO `audit_log`;--> statement-breakpoint
CREATE INDEX `audit_log_userId_idx` ON `audit_log` (`user_id`);--> statement-breakpoint
CREATE INDEX `audit_log_action_idx` ON `audit_log` (`action`);--> statement-breakpoint
CREATE INDEX `audit_log_targetType_idx` ON `audit_log` (`target_type`);--> statement-breakpoint
CREATE INDEX `audit_log_targetId_idx` ON `audit_log` (`target_id`);--> statement-breakpoint
CREATE INDEX `audit_log_createdAt_idx` ON `audit_log` (`created_at`);--> statement-breakpoint
CREATE TABLE `__new_authorized_signatory` (
	`id` text PRIMARY KEY NOT NULL,
	`onboarding_id` text NOT NULL,
	`full_name` text NOT NULL,
	`title` text,
	`email` text,
	`phone` text,
	`authorization_scope` text,
	`authorization_limit` real,
	`id_document_type` text,
	`id_document_number` text,
	`board_resolution_date` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`onboarding_id`) REFERENCES `onboarding`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_authorized_signatory`("id", "onboarding_id", "full_name", "title", "email", "phone", "authorization_scope", "authorization_limit", "id_document_type", "id_document_number", "board_resolution_date", "created_at", "updated_at") SELECT "id", "onboarding_id", "full_name", "title", "email", "phone", "authorization_scope", "authorization_limit", "id_document_type", "id_document_number", "board_resolution_date", "created_at", "updated_at" FROM `authorized_signatory`;--> statement-breakpoint
DROP TABLE `authorized_signatory`;--> statement-breakpoint
ALTER TABLE `__new_authorized_signatory` RENAME TO `authorized_signatory`;--> statement-breakpoint
CREATE INDEX `authorized_signatory_onboardingId_idx` ON `authorized_signatory` (`onboarding_id`);--> statement-breakpoint
CREATE TABLE `__new_banking_verification` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`request_type` text NOT NULL,
	`bank_name` text NOT NULL,
	`account_holder_name` text NOT NULL,
	`account_number_last4` text,
	`routing_number` text,
	`account_type` text,
	`swift_bic` text,
	`status` text DEFAULT 'pending_callback' NOT NULL,
	`requested_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`request_ip_address` text,
	`callback_scheduled_at` integer,
	`callback_phone_number` text,
	`callback_attempts` text,
	`verified_by` text,
	`verified_at` integer,
	`verification_notes` text,
	`rejected_by` text,
	`rejected_at` integer,
	`rejection_reason` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`verified_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`rejected_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_banking_verification`("id", "user_id", "request_type", "bank_name", "account_holder_name", "account_number_last4", "routing_number", "account_type", "swift_bic", "status", "requested_at", "request_ip_address", "callback_scheduled_at", "callback_phone_number", "callback_attempts", "verified_by", "verified_at", "verification_notes", "rejected_by", "rejected_at", "rejection_reason", "created_at", "updated_at") SELECT "id", "user_id", "request_type", "bank_name", "account_holder_name", "account_number_last4", "routing_number", "account_type", "swift_bic", "status", "requested_at", "request_ip_address", "callback_scheduled_at", "callback_phone_number", "callback_attempts", "verified_by", "verified_at", "verification_notes", "rejected_by", "rejected_at", "rejection_reason", "created_at", "updated_at" FROM `banking_verification`;--> statement-breakpoint
DROP TABLE `banking_verification`;--> statement-breakpoint
ALTER TABLE `__new_banking_verification` RENAME TO `banking_verification`;--> statement-breakpoint
CREATE INDEX `banking_verification_userId_idx` ON `banking_verification` (`user_id`);--> statement-breakpoint
CREATE INDEX `banking_verification_status_idx` ON `banking_verification` (`status`);--> statement-breakpoint
CREATE TABLE `__new_beneficial_owner` (
	`id` text PRIMARY KEY NOT NULL,
	`onboarding_id` text NOT NULL,
	`full_name` text NOT NULL,
	`date_of_birth` text,
	`nationality` text,
	`country_of_residence` text,
	`ownership_percentage` real NOT NULL,
	`control_type` text,
	`address_line_1` text,
	`address_line_2` text,
	`city` text,
	`state_province` text,
	`postal_code` text,
	`country` text,
	`id_document_type` text,
	`id_document_number` text,
	`id_expiry_date` text,
	`is_pep` integer DEFAULT false,
	`pep_details` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`onboarding_id`) REFERENCES `onboarding`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_beneficial_owner`("id", "onboarding_id", "full_name", "date_of_birth", "nationality", "country_of_residence", "ownership_percentage", "control_type", "address_line_1", "address_line_2", "city", "state_province", "postal_code", "country", "id_document_type", "id_document_number", "id_expiry_date", "is_pep", "pep_details", "created_at", "updated_at") SELECT "id", "onboarding_id", "full_name", "date_of_birth", "nationality", "country_of_residence", "ownership_percentage", "control_type", "address_line_1", "address_line_2", "city", "state_province", "postal_code", "country", "id_document_type", "id_document_number", "id_expiry_date", "is_pep", "pep_details", "created_at", "updated_at" FROM `beneficial_owner`;--> statement-breakpoint
DROP TABLE `beneficial_owner`;--> statement-breakpoint
ALTER TABLE `__new_beneficial_owner` RENAME TO `beneficial_owner`;--> statement-breakpoint
CREATE INDEX `beneficial_owner_onboardingId_idx` ON `beneficial_owner` (`onboarding_id`);--> statement-breakpoint
CREATE TABLE `__new_capital_notice` (
	`id` text PRIMARY KEY NOT NULL,
	`deal_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`total_amount` real NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`due_date` integer,
	`distribution_date` integer,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`approved_by` text,
	`approved_at` integer,
	`approval_notes` text,
	`sent_at` integer,
	`sent_by` text,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`deal_id`) REFERENCES `deal`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`approved_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`sent_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_capital_notice`("id", "deal_id", "type", "title", "description", "total_amount", "currency", "due_date", "distribution_date", "status", "created_by", "created_at", "approved_by", "approved_at", "approval_notes", "sent_at", "sent_by", "updated_at") SELECT "id", "deal_id", "type", "title", "description", "total_amount", "currency", "due_date", "distribution_date", "status", "created_by", "created_at", "approved_by", "approved_at", "approval_notes", "sent_at", "sent_by", "updated_at" FROM `capital_notice`;--> statement-breakpoint
DROP TABLE `capital_notice`;--> statement-breakpoint
ALTER TABLE `__new_capital_notice` RENAME TO `capital_notice`;--> statement-breakpoint
CREATE INDEX `capital_notice_dealId_idx` ON `capital_notice` (`deal_id`);--> statement-breakpoint
CREATE INDEX `capital_notice_status_idx` ON `capital_notice` (`status`);--> statement-breakpoint
CREATE INDEX `capital_notice_type_idx` ON `capital_notice` (`type`);--> statement-breakpoint
CREATE TABLE `__new_capital_notice_recipient` (
	`id` text PRIMARY KEY NOT NULL,
	`notice_id` text NOT NULL,
	`user_id` text NOT NULL,
	`amount` real NOT NULL,
	`email_sent_at` integer,
	`email_delivered_at` integer,
	`email_bounced_at` integer,
	`read_at` integer,
	`read_ip_address` text,
	`responded_at` integer,
	`response` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`notice_id`) REFERENCES `capital_notice`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_capital_notice_recipient`("id", "notice_id", "user_id", "amount", "email_sent_at", "email_delivered_at", "email_bounced_at", "read_at", "read_ip_address", "responded_at", "response", "created_at", "updated_at") SELECT "id", "notice_id", "user_id", "amount", "email_sent_at", "email_delivered_at", "email_bounced_at", "read_at", "read_ip_address", "responded_at", "response", "created_at", "updated_at" FROM `capital_notice_recipient`;--> statement-breakpoint
DROP TABLE `capital_notice_recipient`;--> statement-breakpoint
ALTER TABLE `__new_capital_notice_recipient` RENAME TO `capital_notice_recipient`;--> statement-breakpoint
CREATE INDEX `capital_notice_recipient_noticeId_idx` ON `capital_notice_recipient` (`notice_id`);--> statement-breakpoint
CREATE INDEX `capital_notice_recipient_userId_idx` ON `capital_notice_recipient` (`user_id`);--> statement-breakpoint
CREATE TABLE `__new_deal` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text,
	`description` text,
	`teaser_summary` text,
	`sector` text,
	`geography` text,
	`deal_type` text,
	`target_raise` real,
	`min_investment` real,
	`target_irr` real,
	`target_moic` real,
	`status` text DEFAULT 'draft' NOT NULL,
	`visibility` text DEFAULT 'invite_only' NOT NULL,
	`cover_image_url` text,
	`launch_date` integer,
	`close_date` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
INSERT INTO `__new_deal`("id", "name", "slug", "description", "teaser_summary", "sector", "geography", "deal_type", "target_raise", "min_investment", "target_irr", "target_moic", "status", "visibility", "cover_image_url", "launch_date", "close_date", "created_at", "updated_at") SELECT "id", "name", "slug", "description", "teaser_summary", "sector", "geography", "deal_type", "target_raise", "min_investment", "target_irr", "target_moic", "status", "visibility", "cover_image_url", "launch_date", "close_date", "created_at", "updated_at" FROM `deal`;--> statement-breakpoint
DROP TABLE `deal`;--> statement-breakpoint
ALTER TABLE `__new_deal` RENAME TO `deal`;--> statement-breakpoint
CREATE UNIQUE INDEX `deal_slug_unique` ON `deal` (`slug`);--> statement-breakpoint
CREATE TABLE `__new_deal_document` (
	`id` text PRIMARY KEY NOT NULL,
	`deal_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`document_category` text,
	`current_version_id` text,
	`sensitivity` text DEFAULT 'standard' NOT NULL,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`deal_id`) REFERENCES `deal`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_deal_document`("id", "deal_id", "name", "description", "document_category", "current_version_id", "sensitivity", "created_by", "created_at", "updated_at") SELECT "id", "deal_id", "name", "description", "document_category", "current_version_id", "sensitivity", "created_by", "created_at", "updated_at" FROM `deal_document`;--> statement-breakpoint
DROP TABLE `deal_document`;--> statement-breakpoint
ALTER TABLE `__new_deal_document` RENAME TO `deal_document`;--> statement-breakpoint
CREATE INDEX `deal_document_dealId_idx` ON `deal_document` (`deal_id`);--> statement-breakpoint
CREATE INDEX `deal_document_category_idx` ON `deal_document` (`document_category`);--> statement-breakpoint
CREATE TABLE `__new_deal_interest` (
	`id` text PRIMARY KEY NOT NULL,
	`deal_id` text NOT NULL,
	`user_id` text NOT NULL,
	`status` text DEFAULT 'interested' NOT NULL,
	`proposed_amount` real,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`deal_id`) REFERENCES `deal`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_deal_interest`("id", "deal_id", "user_id", "status", "proposed_amount", "created_at", "updated_at") SELECT "id", "deal_id", "user_id", "status", "proposed_amount", "created_at", "updated_at" FROM `deal_interest`;--> statement-breakpoint
DROP TABLE `deal_interest`;--> statement-breakpoint
ALTER TABLE `__new_deal_interest` RENAME TO `deal_interest`;--> statement-breakpoint
CREATE UNIQUE INDEX `deal_interest_deal_user_uniq` ON `deal_interest` (`deal_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `__new_deal_invite` (
	`id` text PRIMARY KEY NOT NULL,
	`deal_id` text NOT NULL,
	`user_id` text NOT NULL,
	`curation_note` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`deal_id`) REFERENCES `deal`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_deal_invite`("id", "deal_id", "user_id", "curation_note", "created_at") SELECT "id", "deal_id", "user_id", "curation_note", "created_at" FROM `deal_invite`;--> statement-breakpoint
DROP TABLE `deal_invite`;--> statement-breakpoint
ALTER TABLE `__new_deal_invite` RENAME TO `deal_invite`;--> statement-breakpoint
CREATE INDEX `deal_invite_user_idx` ON `deal_invite` (`user_id`);--> statement-breakpoint
CREATE INDEX `deal_invite_deal_idx` ON `deal_invite` (`deal_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `deal_invite_deal_user_uniq` ON `deal_invite` (`deal_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `__new_document_version` (
	`id` text PRIMARY KEY NOT NULL,
	`document_id` text NOT NULL,
	`version_number` text NOT NULL,
	`file_name` text NOT NULL,
	`file_size` text NOT NULL,
	`file_type` text NOT NULL,
	`file_path` text,
	`file_url` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`uploaded_by` text,
	`uploaded_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`reviewed_by` text,
	`reviewed_at` integer,
	`review_notes` text,
	`approved_by` text,
	`approved_at` integer,
	`published_at` integer,
	`published_by` text,
	`superseded_at` integer,
	`superseded_by` text,
	`superseded_by_version_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`document_id`) REFERENCES `deal_document`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`uploaded_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`reviewed_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`approved_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`published_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`superseded_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_document_version`("id", "document_id", "version_number", "file_name", "file_size", "file_type", "file_path", "file_url", "status", "uploaded_by", "uploaded_at", "reviewed_by", "reviewed_at", "review_notes", "approved_by", "approved_at", "published_at", "published_by", "superseded_at", "superseded_by", "superseded_by_version_id", "created_at", "updated_at") SELECT "id", "document_id", "version_number", "file_name", "file_size", "file_type", "file_path", "file_url", "status", "uploaded_by", "uploaded_at", "reviewed_by", "reviewed_at", "review_notes", "approved_by", "approved_at", "published_at", "published_by", "superseded_at", "superseded_by", "superseded_by_version_id", "created_at", "updated_at" FROM `document_version`;--> statement-breakpoint
DROP TABLE `document_version`;--> statement-breakpoint
ALTER TABLE `__new_document_version` RENAME TO `document_version`;--> statement-breakpoint
CREATE INDEX `document_version_documentId_idx` ON `document_version` (`document_id`);--> statement-breakpoint
CREATE INDEX `document_version_status_idx` ON `document_version` (`status`);--> statement-breakpoint
CREATE TABLE `__new_document_visibility` (
	`id` text PRIMARY KEY NOT NULL,
	`document_version_id` text NOT NULL,
	`visibility_type` text NOT NULL,
	`user_ids` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`document_version_id`) REFERENCES `document_version`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_document_visibility`("id", "document_version_id", "visibility_type", "user_ids", "created_at") SELECT "id", "document_version_id", "visibility_type", "user_ids", "created_at" FROM `document_visibility`;--> statement-breakpoint
DROP TABLE `document_visibility`;--> statement-breakpoint
ALTER TABLE `__new_document_visibility` RENAME TO `document_visibility`;--> statement-breakpoint
CREATE INDEX `document_visibility_versionId_idx` ON `document_visibility` (`document_version_id`);--> statement-breakpoint
CREATE TABLE `__new_evidence_export` (
	`id` text PRIMARY KEY NOT NULL,
	`export_type` text NOT NULL,
	`export_path` text NOT NULL,
	`exported_by` text,
	`exported_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`period_start` integer,
	`period_end` integer,
	`retention_years` text DEFAULT '7' NOT NULL,
	`expires_at` integer,
	`file_size` text,
	`checksum` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`exported_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_evidence_export`("id", "export_type", "export_path", "exported_by", "exported_at", "period_start", "period_end", "retention_years", "expires_at", "file_size", "checksum", "created_at") SELECT "id", "export_type", "export_path", "exported_by", "exported_at", "period_start", "period_end", "retention_years", "expires_at", "file_size", "checksum", "created_at" FROM `evidence_export`;--> statement-breakpoint
DROP TABLE `evidence_export`;--> statement-breakpoint
ALTER TABLE `__new_evidence_export` RENAME TO `evidence_export`;--> statement-breakpoint
CREATE INDEX `evidence_export_type_idx` ON `evidence_export` (`export_type`);--> statement-breakpoint
CREATE INDEX `evidence_export_exportedAt_idx` ON `evidence_export` (`exported_at`);--> statement-breakpoint
CREATE TABLE `__new_investment` (
	`id` text PRIMARY KEY NOT NULL,
	`deal_id` text NOT NULL,
	`user_id` text NOT NULL,
	`committed_amount` real NOT NULL,
	`committed_date` integer NOT NULL,
	`funded_amount` real DEFAULT 0,
	`current_value` real,
	`distributions` real DEFAULT 0,
	`status` text DEFAULT 'active' NOT NULL,
	`ownership_percentage` real,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`deal_id`) REFERENCES `deal`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
INSERT INTO `__new_investment`("id", "deal_id", "user_id", "committed_amount", "committed_date", "funded_amount", "current_value", "distributions", "status", "ownership_percentage", "created_at", "updated_at") SELECT "id", "deal_id", "user_id", "committed_amount", "committed_date", "funded_amount", "current_value", "distributions", "status", "ownership_percentage", "created_at", "updated_at" FROM `investment`;--> statement-breakpoint
DROP TABLE `investment`;--> statement-breakpoint
ALTER TABLE `__new_investment` RENAME TO `investment`;--> statement-breakpoint
CREATE TABLE `__new_investment_document` (
	`id` text PRIMARY KEY NOT NULL,
	`investment_id` text NOT NULL,
	`document_type` text NOT NULL,
	`file_name` text NOT NULL,
	`file_size` text NOT NULL,
	`file_type` text NOT NULL,
	`file_url` text,
	`file_path` text,
	`period_start` integer,
	`period_end` integer,
	`year` text,
	`uploaded_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`investment_id`) REFERENCES `investment`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_investment_document`("id", "investment_id", "document_type", "file_name", "file_size", "file_type", "file_url", "file_path", "period_start", "period_end", "year", "uploaded_at", "created_at", "updated_at") SELECT "id", "investment_id", "document_type", "file_name", "file_size", "file_type", "file_url", "file_path", "period_start", "period_end", "year", "uploaded_at", "created_at", "updated_at" FROM `investment_document`;--> statement-breakpoint
DROP TABLE `investment_document`;--> statement-breakpoint
ALTER TABLE `__new_investment_document` RENAME TO `investment_document`;--> statement-breakpoint
CREATE INDEX `investment_document_investmentId_idx` ON `investment_document` (`investment_id`);--> statement-breakpoint
CREATE INDEX `investment_document_documentType_idx` ON `investment_document` (`document_type`);--> statement-breakpoint
CREATE INDEX `investment_document_year_idx` ON `investment_document` (`year`);--> statement-breakpoint
CREATE TABLE `__new_investor_clearance` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`conditions` text,
	`conditions_json` text,
	`cleared_by` text,
	`cleared_at` integer,
	`notes` text,
	`investor_visible_notes` text,
	`expires_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`cleared_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_investor_clearance`("id", "user_id", "status", "conditions", "conditions_json", "cleared_by", "cleared_at", "notes", "investor_visible_notes", "expires_at", "created_at", "updated_at") SELECT "id", "user_id", "status", "conditions", "conditions_json", "cleared_by", "cleared_at", "notes", "investor_visible_notes", "expires_at", "created_at", "updated_at" FROM `investor_clearance`;--> statement-breakpoint
DROP TABLE `investor_clearance`;--> statement-breakpoint
ALTER TABLE `__new_investor_clearance` RENAME TO `investor_clearance`;--> statement-breakpoint
CREATE INDEX `investor_clearance_userId_idx` ON `investor_clearance` (`user_id`);--> statement-breakpoint
CREATE INDEX `investor_clearance_status_idx` ON `investor_clearance` (`status`);--> statement-breakpoint
CREATE TABLE `__new_kyc_attestation` (
	`id` text PRIMARY KEY NOT NULL,
	`onboarding_id` text NOT NULL,
	`accuracy_attested` integer DEFAULT false NOT NULL,
	`accuracy_attested_at` integer,
	`sanctions_declaration_attested` integer DEFAULT false NOT NULL,
	`sanctions_declaration_attested_at` integer,
	`data_consent_attested` integer DEFAULT false NOT NULL,
	`data_consent_attested_at` integer,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`onboarding_id`) REFERENCES `onboarding`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_kyc_attestation`("id", "onboarding_id", "accuracy_attested", "accuracy_attested_at", "sanctions_declaration_attested", "sanctions_declaration_attested_at", "data_consent_attested", "data_consent_attested_at", "ip_address", "user_agent", "created_at", "updated_at") SELECT "id", "onboarding_id", "accuracy_attested", "accuracy_attested_at", "sanctions_declaration_attested", "sanctions_declaration_attested_at", "data_consent_attested", "data_consent_attested_at", "ip_address", "user_agent", "created_at", "updated_at" FROM `kyc_attestation`;--> statement-breakpoint
DROP TABLE `kyc_attestation`;--> statement-breakpoint
ALTER TABLE `__new_kyc_attestation` RENAME TO `kyc_attestation`;--> statement-breakpoint
CREATE INDEX `kyc_attestation_onboardingId_idx` ON `kyc_attestation` (`onboarding_id`);--> statement-breakpoint
CREATE TABLE `__new_onboarding` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`legal_entity_type` text,
	`pep_status` integer DEFAULT false,
	`pep_details` text,
	`source_of_wealth_narrative` text,
	`accuracy_attestation` integer DEFAULT false,
	`sanctions_declaration` integer DEFAULT false,
	`data_consent` integer DEFAULT false,
	`organization_name` text NOT NULL,
	`primary_contact_name` text NOT NULL,
	`primary_contact_title` text,
	`primary_contact_email` text NOT NULL,
	`primary_contact_phone` text NOT NULL,
	`capital_provider_type` text NOT NULL,
	`investor_type` text NOT NULL,
	`geographic_focus` text,
	`accreditation_status` text,
	`accreditation_method` text,
	`entity_tax_id` text,
	`entity_signatory_name` text,
	`entity_signatory_title` text,
	`open_to_emerging_sponsor` text NOT NULL,
	`minimum_requirements` text,
	`prior_deal_attribution` text NOT NULL,
	`prior_deal_attribution_explanation` text,
	`nda_preference` text NOT NULL,
	`nda_limitations` text,
	`timing_to_loi` text NOT NULL,
	`timing_to_commitment` text NOT NULL,
	`timing_drivers` text,
	`economics_description` text NOT NULL,
	`preferred_role` text NOT NULL,
	`governance_expectations` text,
	`provide_support_letter` text NOT NULL,
	`join_broker_conversations` text NOT NULL,
	`support_letter_stages` text NOT NULL,
	`receive_updates` text NOT NULL,
	`update_frequency` text,
	`update_format` text,
	`industry_preferences` text,
	`equity_check_size` text NOT NULL,
	`enterprise_value_range` text,
	`ebitda_range` text,
	`preferred_ownership` text NOT NULL,
	`typical_hold_period` text,
	`transaction_types` text NOT NULL,
	`leverage_tolerance` text,
	`revenue_characteristics` text NOT NULL,
	`customer_concentration` text,
	`margins_and_cash_flow` text,
	`asset_profile` text NOT NULL,
	`management_involvement` text,
	`sectors_of_interest` text NOT NULL,
	`sectors_to_avoid` text,
	`deal_size_thresholds` text,
	`specific_themes` text,
	`legal_documents_acknowledged` integer DEFAULT false,
	`electronic_signature_name` text,
	`electronic_signature_date` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`submitted_at` integer,
	`reviewed_at` integer,
	`reviewed_by` text,
	`review_notes` text,
	`last_edited_at` integer,
	`last_edited_by` text,
	`edit_count` text DEFAULT '0',
	`is_editable` integer DEFAULT true,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_onboarding`("id", "user_id", "legal_entity_type", "pep_status", "pep_details", "source_of_wealth_narrative", "accuracy_attestation", "sanctions_declaration", "data_consent", "organization_name", "primary_contact_name", "primary_contact_title", "primary_contact_email", "primary_contact_phone", "capital_provider_type", "investor_type", "geographic_focus", "accreditation_status", "accreditation_method", "entity_tax_id", "entity_signatory_name", "entity_signatory_title", "open_to_emerging_sponsor", "minimum_requirements", "prior_deal_attribution", "prior_deal_attribution_explanation", "nda_preference", "nda_limitations", "timing_to_loi", "timing_to_commitment", "timing_drivers", "economics_description", "preferred_role", "governance_expectations", "provide_support_letter", "join_broker_conversations", "support_letter_stages", "receive_updates", "update_frequency", "update_format", "industry_preferences", "equity_check_size", "enterprise_value_range", "ebitda_range", "preferred_ownership", "typical_hold_period", "transaction_types", "leverage_tolerance", "revenue_characteristics", "customer_concentration", "margins_and_cash_flow", "asset_profile", "management_involvement", "sectors_of_interest", "sectors_to_avoid", "deal_size_thresholds", "specific_themes", "legal_documents_acknowledged", "electronic_signature_name", "electronic_signature_date", "status", "submitted_at", "reviewed_at", "reviewed_by", "review_notes", "last_edited_at", "last_edited_by", "edit_count", "is_editable", "created_at", "updated_at") SELECT "id", "user_id", "legal_entity_type", "pep_status", "pep_details", "source_of_wealth_narrative", "accuracy_attestation", "sanctions_declaration", "data_consent", "organization_name", "primary_contact_name", "primary_contact_title", "primary_contact_email", "primary_contact_phone", "capital_provider_type", "investor_type", "geographic_focus", "accreditation_status", "accreditation_method", "entity_tax_id", "entity_signatory_name", "entity_signatory_title", "open_to_emerging_sponsor", "minimum_requirements", "prior_deal_attribution", "prior_deal_attribution_explanation", "nda_preference", "nda_limitations", "timing_to_loi", "timing_to_commitment", "timing_drivers", "economics_description", "preferred_role", "governance_expectations", "provide_support_letter", "join_broker_conversations", "support_letter_stages", "receive_updates", "update_frequency", "update_format", "industry_preferences", "equity_check_size", "enterprise_value_range", "ebitda_range", "preferred_ownership", "typical_hold_period", "transaction_types", "leverage_tolerance", "revenue_characteristics", "customer_concentration", "margins_and_cash_flow", "asset_profile", "management_involvement", "sectors_of_interest", "sectors_to_avoid", "deal_size_thresholds", "specific_themes", "legal_documents_acknowledged", "electronic_signature_name", "electronic_signature_date", "status", "submitted_at", "reviewed_at", "reviewed_by", "review_notes", "last_edited_at", "last_edited_by", "edit_count", "is_editable", "created_at", "updated_at" FROM `onboarding`;--> statement-breakpoint
DROP TABLE `onboarding`;--> statement-breakpoint
ALTER TABLE `__new_onboarding` RENAME TO `onboarding`;--> statement-breakpoint
CREATE INDEX `onboarding_userId_idx` ON `onboarding` (`user_id`);--> statement-breakpoint
CREATE INDEX `onboarding_status_idx` ON `onboarding` (`status`);--> statement-breakpoint
CREATE INDEX `onboarding_submittedAt_idx` ON `onboarding` (`submitted_at`);--> statement-breakpoint
CREATE TABLE `__new_onboarding_document` (
	`id` text PRIMARY KEY NOT NULL,
	`onboarding_id` text NOT NULL,
	`document_type` text NOT NULL,
	`file_name` text NOT NULL,
	`file_size` text NOT NULL,
	`file_type` text NOT NULL,
	`file_url` text,
	`file_path` text,
	`uploaded_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`reviewed_at` integer,
	`reviewed_by` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`onboarding_id`) REFERENCES `onboarding`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_onboarding_document`("id", "onboarding_id", "document_type", "file_name", "file_size", "file_type", "file_url", "file_path", "uploaded_at", "status", "reviewed_at", "reviewed_by", "created_at", "updated_at") SELECT "id", "onboarding_id", "document_type", "file_name", "file_size", "file_type", "file_url", "file_path", "uploaded_at", "status", "reviewed_at", "reviewed_by", "created_at", "updated_at" FROM `onboarding_document`;--> statement-breakpoint
DROP TABLE `onboarding_document`;--> statement-breakpoint
ALTER TABLE `__new_onboarding_document` RENAME TO `onboarding_document`;--> statement-breakpoint
CREATE INDEX `onboarding_document_onboardingId_idx` ON `onboarding_document` (`onboarding_id`);--> statement-breakpoint
CREATE INDEX `onboarding_document_documentType_idx` ON `onboarding_document` (`document_type`);--> statement-breakpoint
CREATE TABLE `__new_onboarding_edit_history` (
	`id` text PRIMARY KEY NOT NULL,
	`onboarding_id` text NOT NULL,
	`user_id` text NOT NULL,
	`field_name` text NOT NULL,
	`field_label` text,
	`previous_value` text,
	`new_value` text,
	`edited_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`edit_reason` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`onboarding_id`) REFERENCES `onboarding`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_onboarding_edit_history`("id", "onboarding_id", "user_id", "field_name", "field_label", "previous_value", "new_value", "edited_at", "edit_reason", "created_at") SELECT "id", "onboarding_id", "user_id", "field_name", "field_label", "previous_value", "new_value", "edited_at", "edit_reason", "created_at" FROM `onboarding_edit_history`;--> statement-breakpoint
DROP TABLE `onboarding_edit_history`;--> statement-breakpoint
ALTER TABLE `__new_onboarding_edit_history` RENAME TO `onboarding_edit_history`;--> statement-breakpoint
CREATE INDEX `onboarding_edit_history_onboardingId_idx` ON `onboarding_edit_history` (`onboarding_id`);--> statement-breakpoint
CREATE INDEX `onboarding_edit_history_userId_idx` ON `onboarding_edit_history` (`user_id`);--> statement-breakpoint
CREATE INDEX `onboarding_edit_history_editedAt_idx` ON `onboarding_edit_history` (`edited_at`);--> statement-breakpoint
CREATE TABLE `__new_session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	`impersonated_by` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_session`("id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id", "impersonated_by") SELECT "id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id", "impersonated_by" FROM `session`;--> statement-breakpoint
DROP TABLE `session`;--> statement-breakpoint
ALTER TABLE `__new_session` RENAME TO `session`;--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `__new_side_effect_outbox` (
	`id` text PRIMARY KEY NOT NULL,
	`topic` text NOT NULL,
	`dedupe_key` text NOT NULL,
	`payload` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`last_error` text,
	`dispatched_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_side_effect_outbox`("id", "topic", "dedupe_key", "payload", "status", "attempts", "last_error", "dispatched_at", "created_at", "updated_at") SELECT "id", "topic", "dedupe_key", "payload", "status", "attempts", "last_error", "dispatched_at", "created_at", "updated_at" FROM `side_effect_outbox`;--> statement-breakpoint
DROP TABLE `side_effect_outbox`;--> statement-breakpoint
ALTER TABLE `__new_side_effect_outbox` RENAME TO `side_effect_outbox`;--> statement-breakpoint
CREATE UNIQUE INDEX `side_effect_outbox_dedupe_key_unique` ON `side_effect_outbox` (`dedupe_key`);--> statement-breakpoint
CREATE INDEX `side_effect_outbox_status_idx` ON `side_effect_outbox` (`status`);--> statement-breakpoint
CREATE INDEX `side_effect_outbox_created_at_idx` ON `side_effect_outbox` (`created_at`);--> statement-breakpoint
CREATE TABLE `__new_user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`is_onboarding_completed` integer DEFAULT false NOT NULL,
	`kyc_status` text DEFAULT 'review' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`role` text,
	`banned` integer DEFAULT false,
	`ban_reason` text,
	`ban_expires` integer
);
--> statement-breakpoint
INSERT INTO `__new_user`("id", "name", "email", "email_verified", "image", "is_onboarding_completed", "kyc_status", "created_at", "updated_at", "role", "banned", "ban_reason", "ban_expires") SELECT "id", "name", "email", "email_verified", "image", "is_onboarding_completed", "kyc_status", "created_at", "updated_at", "role", "banned", "ban_reason", "ban_expires" FROM `user`;--> statement-breakpoint
DROP TABLE `user`;--> statement-breakpoint
ALTER TABLE `__new_user` RENAME TO `user`;--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `__new_user_role_assignment` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`granted_by` text,
	`granted_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`revoked_at` integer,
	`revoked_by` text,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`granted_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`revoked_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_user_role_assignment`("id", "user_id", "role", "granted_by", "granted_at", "revoked_at", "revoked_by", "notes", "created_at") SELECT "id", "user_id", "role", "granted_by", "granted_at", "revoked_at", "revoked_by", "notes", "created_at" FROM `user_role_assignment`;--> statement-breakpoint
DROP TABLE `user_role_assignment`;--> statement-breakpoint
ALTER TABLE `__new_user_role_assignment` RENAME TO `user_role_assignment`;--> statement-breakpoint
CREATE INDEX `user_role_assignment_userId_idx` ON `user_role_assignment` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_role_assignment_role_idx` ON `user_role_assignment` (`role`);--> statement-breakpoint
CREATE TABLE `__new_vehicle_permission` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`deal_id` text NOT NULL,
	`can_view_teaser` integer DEFAULT true NOT NULL,
	`can_view_documents` integer DEFAULT false NOT NULL,
	`can_express_interest` integer DEFAULT false NOT NULL,
	`can_invest` integer DEFAULT false NOT NULL,
	`granted_by` text,
	`granted_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`notes` text,
	`revoked_at` integer,
	`revoked_by` text,
	`revoke_reason` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`deal_id`) REFERENCES `deal`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`granted_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`revoked_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_vehicle_permission`("id", "user_id", "deal_id", "can_view_teaser", "can_view_documents", "can_express_interest", "can_invest", "granted_by", "granted_at", "notes", "revoked_at", "revoked_by", "revoke_reason", "created_at", "updated_at") SELECT "id", "user_id", "deal_id", "can_view_teaser", "can_view_documents", "can_express_interest", "can_invest", "granted_by", "granted_at", "notes", "revoked_at", "revoked_by", "revoke_reason", "created_at", "updated_at" FROM `vehicle_permission`;--> statement-breakpoint
DROP TABLE `vehicle_permission`;--> statement-breakpoint
ALTER TABLE `__new_vehicle_permission` RENAME TO `vehicle_permission`;--> statement-breakpoint
CREATE INDEX `vehicle_permission_userId_idx` ON `vehicle_permission` (`user_id`);--> statement-breakpoint
CREATE INDEX `vehicle_permission_dealId_idx` ON `vehicle_permission` (`deal_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `vehicle_permission_user_deal_active_uniq` ON `vehicle_permission` (`user_id`,`deal_id`);--> statement-breakpoint
CREATE TABLE `__new_verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_verification`("id", "identifier", "value", "expires_at", "created_at", "updated_at") SELECT "id", "identifier", "value", "expires_at", "created_at", "updated_at" FROM `verification`;--> statement-breakpoint
DROP TABLE `verification`;--> statement-breakpoint
ALTER TABLE `__new_verification` RENAME TO `verification`;--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);