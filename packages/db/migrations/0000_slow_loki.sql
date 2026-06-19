CREATE TABLE `account` (
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
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `audit_log` (
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
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `audit_log_userId_idx` ON `audit_log` (`user_id`);--> statement-breakpoint
CREATE INDEX `audit_log_action_idx` ON `audit_log` (`action`);--> statement-breakpoint
CREATE INDEX `audit_log_targetType_idx` ON `audit_log` (`target_type`);--> statement-breakpoint
CREATE INDEX `audit_log_targetId_idx` ON `audit_log` (`target_id`);--> statement-breakpoint
CREATE INDEX `audit_log_createdAt_idx` ON `audit_log` (`created_at`);--> statement-breakpoint
CREATE TABLE `authorized_signatory` (
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
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`onboarding_id`) REFERENCES `onboarding`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `authorized_signatory_onboardingId_idx` ON `authorized_signatory` (`onboarding_id`);--> statement-breakpoint
CREATE TABLE `banking_verification` (
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
	`requested_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
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
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`verified_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`rejected_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `banking_verification_userId_idx` ON `banking_verification` (`user_id`);--> statement-breakpoint
CREATE INDEX `banking_verification_status_idx` ON `banking_verification` (`status`);--> statement-breakpoint
CREATE TABLE `beneficial_owner` (
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
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`onboarding_id`) REFERENCES `onboarding`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `beneficial_owner_onboardingId_idx` ON `beneficial_owner` (`onboarding_id`);--> statement-breakpoint
CREATE TABLE `capital_notice` (
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
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`approved_by` text,
	`approved_at` integer,
	`approval_notes` text,
	`sent_at` integer,
	`sent_by` text,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`deal_id`) REFERENCES `deal`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`approved_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`sent_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `capital_notice_dealId_idx` ON `capital_notice` (`deal_id`);--> statement-breakpoint
CREATE INDEX `capital_notice_status_idx` ON `capital_notice` (`status`);--> statement-breakpoint
CREATE INDEX `capital_notice_type_idx` ON `capital_notice` (`type`);--> statement-breakpoint
CREATE TABLE `capital_notice_recipient` (
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
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`notice_id`) REFERENCES `capital_notice`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `capital_notice_recipient_noticeId_idx` ON `capital_notice_recipient` (`notice_id`);--> statement-breakpoint
CREATE INDEX `capital_notice_recipient_userId_idx` ON `capital_notice_recipient` (`user_id`);--> statement-breakpoint
CREATE TABLE `deal` (
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
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `deal_slug_unique` ON `deal` (`slug`);--> statement-breakpoint
CREATE TABLE `deal_document` (
	`id` text PRIMARY KEY NOT NULL,
	`deal_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`document_category` text,
	`current_version_id` text,
	`sensitivity` text DEFAULT 'standard' NOT NULL,
	`created_by` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`deal_id`) REFERENCES `deal`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `deal_document_dealId_idx` ON `deal_document` (`deal_id`);--> statement-breakpoint
CREATE INDEX `deal_document_category_idx` ON `deal_document` (`document_category`);--> statement-breakpoint
CREATE TABLE `deal_interest` (
	`id` text PRIMARY KEY NOT NULL,
	`deal_id` text NOT NULL,
	`user_id` text NOT NULL,
	`status` text DEFAULT 'interested' NOT NULL,
	`proposed_amount` real,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	FOREIGN KEY (`deal_id`) REFERENCES `deal`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `deal_interest_deal_user_uniq` ON `deal_interest` (`deal_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `deal_invite` (
	`id` text PRIMARY KEY NOT NULL,
	`deal_id` text NOT NULL,
	`user_id` text NOT NULL,
	`curation_note` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`deal_id`) REFERENCES `deal`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `deal_invite_user_idx` ON `deal_invite` (`user_id`);--> statement-breakpoint
CREATE INDEX `deal_invite_deal_idx` ON `deal_invite` (`deal_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `deal_invite_deal_user_uniq` ON `deal_invite` (`deal_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `document_version` (
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
	`uploaded_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
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
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`document_id`) REFERENCES `deal_document`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`uploaded_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`reviewed_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`approved_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`published_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`superseded_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `document_version_documentId_idx` ON `document_version` (`document_id`);--> statement-breakpoint
CREATE INDEX `document_version_status_idx` ON `document_version` (`status`);--> statement-breakpoint
CREATE TABLE `document_visibility` (
	`id` text PRIMARY KEY NOT NULL,
	`document_version_id` text NOT NULL,
	`visibility_type` text NOT NULL,
	`user_ids` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`document_version_id`) REFERENCES `document_version`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `document_visibility_versionId_idx` ON `document_visibility` (`document_version_id`);--> statement-breakpoint
CREATE TABLE `evidence_export` (
	`id` text PRIMARY KEY NOT NULL,
	`export_type` text NOT NULL,
	`export_path` text NOT NULL,
	`exported_by` text,
	`exported_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`period_start` integer,
	`period_end` integer,
	`retention_years` text DEFAULT '7' NOT NULL,
	`expires_at` integer,
	`file_size` text,
	`checksum` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`exported_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `evidence_export_type_idx` ON `evidence_export` (`export_type`);--> statement-breakpoint
CREATE INDEX `evidence_export_exportedAt_idx` ON `evidence_export` (`exported_at`);--> statement-breakpoint
CREATE TABLE `investment` (
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
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	FOREIGN KEY (`deal_id`) REFERENCES `deal`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `investment_document` (
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
	`uploaded_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`investment_id`) REFERENCES `investment`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `investment_document_investmentId_idx` ON `investment_document` (`investment_id`);--> statement-breakpoint
CREATE INDEX `investment_document_documentType_idx` ON `investment_document` (`document_type`);--> statement-breakpoint
CREATE INDEX `investment_document_year_idx` ON `investment_document` (`year`);--> statement-breakpoint
CREATE TABLE `investor_clearance` (
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
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`cleared_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `investor_clearance_userId_idx` ON `investor_clearance` (`user_id`);--> statement-breakpoint
CREATE INDEX `investor_clearance_status_idx` ON `investor_clearance` (`status`);--> statement-breakpoint
CREATE TABLE `kyc_attestation` (
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
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`onboarding_id`) REFERENCES `onboarding`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `kyc_attestation_onboardingId_idx` ON `kyc_attestation` (`onboarding_id`);--> statement-breakpoint
CREATE TABLE `onboarding` (
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
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `onboarding_userId_idx` ON `onboarding` (`user_id`);--> statement-breakpoint
CREATE INDEX `onboarding_status_idx` ON `onboarding` (`status`);--> statement-breakpoint
CREATE INDEX `onboarding_submittedAt_idx` ON `onboarding` (`submitted_at`);--> statement-breakpoint
CREATE TABLE `onboarding_document` (
	`id` text PRIMARY KEY NOT NULL,
	`onboarding_id` text NOT NULL,
	`document_type` text NOT NULL,
	`file_name` text NOT NULL,
	`file_size` text NOT NULL,
	`file_type` text NOT NULL,
	`file_url` text,
	`file_path` text,
	`uploaded_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`reviewed_at` integer,
	`reviewed_by` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`onboarding_id`) REFERENCES `onboarding`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `onboarding_document_onboardingId_idx` ON `onboarding_document` (`onboarding_id`);--> statement-breakpoint
CREATE INDEX `onboarding_document_documentType_idx` ON `onboarding_document` (`document_type`);--> statement-breakpoint
CREATE TABLE `onboarding_edit_history` (
	`id` text PRIMARY KEY NOT NULL,
	`onboarding_id` text NOT NULL,
	`user_id` text NOT NULL,
	`field_name` text NOT NULL,
	`field_label` text,
	`previous_value` text,
	`new_value` text,
	`edited_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`edit_reason` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`onboarding_id`) REFERENCES `onboarding`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `onboarding_edit_history_onboardingId_idx` ON `onboarding_edit_history` (`onboarding_id`);--> statement-breakpoint
CREATE INDEX `onboarding_edit_history_userId_idx` ON `onboarding_edit_history` (`user_id`);--> statement-breakpoint
CREATE INDEX `onboarding_edit_history_editedAt_idx` ON `onboarding_edit_history` (`edited_at`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	`impersonated_by` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `side_effect_outbox` (
	`id` text PRIMARY KEY NOT NULL,
	`topic` text NOT NULL,
	`dedupe_key` text NOT NULL,
	`payload` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`last_error` text,
	`dispatched_at` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `side_effect_outbox_dedupe_key_unique` ON `side_effect_outbox` (`dedupe_key`);--> statement-breakpoint
CREATE INDEX `side_effect_outbox_status_idx` ON `side_effect_outbox` (`status`);--> statement-breakpoint
CREATE INDEX `side_effect_outbox_created_at_idx` ON `side_effect_outbox` (`created_at`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`is_onboarding_completed` integer DEFAULT false NOT NULL,
	`kyc_status` text DEFAULT 'review' NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`role` text,
	`banned` integer DEFAULT false,
	`ban_reason` text,
	`ban_expires` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `user_role_assignment` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`granted_by` text,
	`granted_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`revoked_at` integer,
	`revoked_by` text,
	`notes` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`granted_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`revoked_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `user_role_assignment_userId_idx` ON `user_role_assignment` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_role_assignment_role_idx` ON `user_role_assignment` (`role`);--> statement-breakpoint
CREATE TABLE `vehicle_permission` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`deal_id` text NOT NULL,
	`can_view_teaser` integer DEFAULT true NOT NULL,
	`can_view_documents` integer DEFAULT false NOT NULL,
	`can_express_interest` integer DEFAULT false NOT NULL,
	`can_invest` integer DEFAULT false NOT NULL,
	`granted_by` text,
	`granted_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`notes` text,
	`revoked_at` integer,
	`revoked_by` text,
	`revoke_reason` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`deal_id`) REFERENCES `deal`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`granted_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`revoked_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `vehicle_permission_userId_idx` ON `vehicle_permission` (`user_id`);--> statement-breakpoint
CREATE INDEX `vehicle_permission_dealId_idx` ON `vehicle_permission` (`deal_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `vehicle_permission_user_deal_active_uniq` ON `vehicle_permission` (`user_id`,`deal_id`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);