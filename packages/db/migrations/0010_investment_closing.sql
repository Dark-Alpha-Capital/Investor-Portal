-- Investment closing workflow: expand investment aggregate + subscription docs

-- Remap legacy statuses before schema consumers expect new values
UPDATE `investment` SET `status` = 'pending_documents' WHERE `status` = 'committed';
UPDATE `investment` SET `status` = 'awaiting_signature' WHERE `status` = 'pending';
UPDATE `investment` SET `status` = 'awaiting_funds' WHERE `status` = 'confirmed';

-- Closing snapshot columns on investment
ALTER TABLE `investment` ADD COLUMN `entity_name` text;
ALTER TABLE `investment` ADD COLUMN `entity_type` text;
ALTER TABLE `investment` ADD COLUMN `acknowledgement_accepted_at` integer;
ALTER TABLE `investment` ADD COLUMN `expires_at` integer;

CREATE INDEX IF NOT EXISTS `investment_status_idx` ON `investment` (`status`);

-- Backfill entity_name from user name where missing
UPDATE `investment`
SET `entity_name` = (
  SELECT `user`.`name` FROM `user` WHERE `user`.`id` = `investment`.`user_id`
)
WHERE `entity_name` IS NULL;

CREATE TABLE `document_template` (
  `id` text PRIMARY KEY NOT NULL,
  `key` text NOT NULL,
  `document_type` text NOT NULL,
  `name` text NOT NULL,
  `body` text NOT NULL,
  `version` integer DEFAULT 1 NOT NULL,
  `signature_required` integer DEFAULT 1 NOT NULL,
  `is_active` integer DEFAULT 1 NOT NULL,
  `created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
CREATE UNIQUE INDEX `document_template_key_unique` ON `document_template` (`key`);
CREATE INDEX `document_template_documentType_idx` ON `document_template` (`document_type`);
CREATE INDEX `document_template_isActive_idx` ON `document_template` (`is_active`);

CREATE TABLE `subscription_package` (
  `id` text PRIMARY KEY NOT NULL,
  `investment_id` text NOT NULL,
  `status` text DEFAULT 'pending' NOT NULL,
  `generated_at` integer,
  `regeneration_count` integer DEFAULT 0 NOT NULL,
  `created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
  FOREIGN KEY (`investment_id`) REFERENCES `investment`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE UNIQUE INDEX `subscription_package_investmentId_uniq` ON `subscription_package` (`investment_id`);
CREATE INDEX `subscription_package_status_idx` ON `subscription_package` (`status`);

CREATE TABLE `subscription_document` (
  `id` text PRIMARY KEY NOT NULL,
  `package_id` text NOT NULL,
  `template_id` text,
  `document_type` text NOT NULL,
  `version` integer DEFAULT 1 NOT NULL,
  `status` text DEFAULT 'not_generated' NOT NULL,
  `signature_required` integer DEFAULT 1 NOT NULL,
  `html_path` text,
  `pdf_path` text,
  `signed_pdf_path` text,
  `generated_at` integer,
  `generated_by` text,
  `sent_at` integer,
  `viewed_at` integer,
  `signed_at` integer,
  `countersigned_at` integer,
  `executed_at` integer,
  `created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
  FOREIGN KEY (`package_id`) REFERENCES `subscription_package`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`template_id`) REFERENCES `document_template`(`id`) ON UPDATE no action ON DELETE set null,
  FOREIGN KEY (`generated_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE INDEX `subscription_document_packageId_idx` ON `subscription_document` (`package_id`);
CREATE INDEX `subscription_document_status_idx` ON `subscription_document` (`status`);
CREATE INDEX `subscription_document_documentType_idx` ON `subscription_document` (`document_type`);

CREATE TABLE `signature_request` (
  `id` text PRIMARY KEY NOT NULL,
  `document_id` text NOT NULL,
  `provider` text DEFAULT 'mock' NOT NULL,
  `external_id` text,
  `signer_user_id` text NOT NULL,
  `signer_role` text NOT NULL,
  `status` text DEFAULT 'pending' NOT NULL,
  `sent_at` integer,
  `viewed_at` integer,
  `signed_at` integer,
  `metadata` text,
  `created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
  FOREIGN KEY (`document_id`) REFERENCES `subscription_document`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`signer_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict
);
CREATE INDEX `signature_request_documentId_idx` ON `signature_request` (`document_id`);
CREATE INDEX `signature_request_signerUserId_idx` ON `signature_request` (`signer_user_id`);
CREATE INDEX `signature_request_status_idx` ON `signature_request` (`status`);

CREATE TABLE `investment_status_history` (
  `id` text PRIMARY KEY NOT NULL,
  `investment_id` text NOT NULL,
  `from_status` text,
  `to_status` text NOT NULL,
  `changed_by` text,
  `reason` text,
  `created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
  FOREIGN KEY (`investment_id`) REFERENCES `investment`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`changed_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE INDEX `investment_status_history_investmentId_idx` ON `investment_status_history` (`investment_id`);
CREATE INDEX `investment_status_history_createdAt_idx` ON `investment_status_history` (`created_at`);

CREATE TABLE `investment_closing_event` (
  `id` text PRIMARY KEY NOT NULL,
  `investment_id` text NOT NULL,
  `event_type` text NOT NULL,
  `actor_user_id` text,
  `payload` text,
  `created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
  FOREIGN KEY (`investment_id`) REFERENCES `investment`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`actor_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE INDEX `investment_closing_event_investmentId_idx` ON `investment_closing_event` (`investment_id`);
CREATE INDEX `investment_closing_event_eventType_idx` ON `investment_closing_event` (`event_type`);
CREATE INDEX `investment_closing_event_createdAt_idx` ON `investment_closing_event` (`created_at`);

CREATE TABLE `document_generation_job` (
  `id` text PRIMARY KEY NOT NULL,
  `package_id` text NOT NULL,
  `status` text DEFAULT 'queued' NOT NULL,
  `attempts` integer DEFAULT 0 NOT NULL,
  `last_error` text,
  `created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
  FOREIGN KEY (`package_id`) REFERENCES `subscription_package`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX `document_generation_job_packageId_idx` ON `document_generation_job` (`package_id`);
CREATE INDEX `document_generation_job_status_idx` ON `document_generation_job` (`status`);

-- Seed placeholder document templates (MVP — replace body later without code changes)
INSERT INTO `document_template` (`id`, `key`, `document_type`, `name`, `body`, `version`, `signature_required`, `is_active`) VALUES
('tmpl_subscription_agreement', 'subscription_agreement_v1', 'subscription_agreement', 'Subscription Agreement',
'<h1>Subscription Agreement</h1>
<p><strong>Deal:</strong> {{DealName}}</p>
<p><strong>Fund:</strong> {{FundName}}</p>
<p><strong>Investor:</strong> {{InvestorName}}</p>
<p><strong>Investing Entity:</strong> {{EntityName}}</p>
<p><strong>Commitment Amount:</strong> {{CommitmentAmount}}</p>
<p><strong>Closing Date:</strong> {{ClosingDate}}</p>
<p><strong>Manager:</strong> {{ManagerName}}</p>
<p><em>Generated:</em> {{GeneratedAt}}</p>
<hr/>
<p>This is a PLACEHOLDER subscription agreement for workflow testing only. It is not a legally binding instrument. Real legal templates may replace this body without changing application logic.</p>
<p>The Investor hereby agrees to subscribe for interests in the Fund in the Commitment Amount set forth above, subject to the terms of the definitive agreements.</p>
<p>IN WITNESS WHEREOF, the parties execute this Agreement as of the Closing Date.</p>',
1, 1, 1),
('tmpl_operating_agreement', 'operating_agreement_v1', 'operating_agreement', 'Operating Agreement',
'<h1>Operating Agreement (Summary Acknowledgement)</h1>
<p><strong>Deal:</strong> {{DealName}}</p>
<p><strong>Fund:</strong> {{FundName}}</p>
<p><strong>Entity:</strong> {{EntityName}}</p>
<p><strong>Investor:</strong> {{InvestorName}}</p>
<p><em>Generated:</em> {{GeneratedAt}}</p>
<hr/>
<p>PLACEHOLDER: By signing, the Investor acknowledges receipt of the Operating Agreement for {{FundName}} and agrees to be bound by its terms as a member / limited partner, as applicable.</p>',
1, 1, 1),
('tmpl_investor_questionnaire', 'investor_questionnaire_v1', 'investor_questionnaire', 'Investor Questionnaire',
'<h1>Investor Questionnaire</h1>
<p><strong>Investor:</strong> {{InvestorName}}</p>
<p><strong>Entity:</strong> {{EntityName}}</p>
<p><strong>Deal:</strong> {{DealName}}</p>
<p><strong>Commitment:</strong> {{CommitmentAmount}}</p>
<p><em>Generated:</em> {{GeneratedAt}}</p>
<hr/>
<p>PLACEHOLDER questionnaire. Confirm accreditation status, source of funds, and investment objectives. Not for regulatory filing.</p>',
1, 1, 1),
('tmpl_tax_form', 'tax_form_v1', 'tax_form', 'Tax Form',
'<h1>Tax Form (W-9 / Equivalent Placeholder)</h1>
<p><strong>Name / Entity:</strong> {{EntityName}}</p>
<p><strong>Investor:</strong> {{InvestorName}}</p>
<p><strong>Deal:</strong> {{DealName}}</p>
<p><em>Generated:</em> {{GeneratedAt}}</p>
<hr/>
<p>PLACEHOLDER tax certification document. Replace with firm-approved W-9 / W-8 template.</p>',
1, 1, 1),
('tmpl_wire_instructions', 'wire_instructions_v1', 'wire_instructions', 'Wire Instructions',
'<h1>Wire Instructions</h1>
<p><strong>Deal:</strong> {{DealName}}</p>
<p><strong>Fund:</strong> {{FundName}}</p>
<p><strong>Commitment Amount:</strong> {{CommitmentAmount}}</p>
<p><strong>Investor / Entity:</strong> {{EntityName}}</p>
<p><em>Generated:</em> {{GeneratedAt}}</p>
<hr/>
<p>PLACEHOLDER wire instructions. Do not remit funds based on this document.</p>
<p>Bank: [Placeholder Bank]<br/>ABA / Routing: 000000000<br/>Account: 00000000<br/>Reference: {{DealName}} — {{EntityName}}</p>',
1, 0, 1);
