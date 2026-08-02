-- Closing state refinement: viewed/countersigned are telemetry, not states.
-- 1) Remap removed enum values to their new equivalents.
-- 2) Add per-document GP countersign + telemetry columns.

-- Investment: partially_signed / fully_signed are gone.
-- Docs still finish via countersign (or auto-execute) then auto-transition to awaiting_funds.
UPDATE `investment` SET `status` = 'awaiting_signature' WHERE `status` IN ('partially_signed', 'fully_signed');

-- Document: `viewed` and `countersigned` are removed as states.
UPDATE `subscription_document` SET `status` = 'sent' WHERE `status` = 'viewed';
UPDATE `subscription_document` SET `status` = 'executed' WHERE `status` = 'countersigned';

-- Signature request: `viewed` is telemetry on the provider record, not a status.
UPDATE `signature_request` SET `status` = 'sent' WHERE `status` = 'viewed';

-- Template-level: whether the GP must countersign this document.
ALTER TABLE `document_template` ADD COLUMN `countersign_required` integer DEFAULT 1 NOT NULL;

-- Per-document: whether the GP must countersign this document.
ALTER TABLE `subscription_document` ADD COLUMN `requires_countersign` integer DEFAULT 1 NOT NULL;

-- Download/view telemetry columns (informational, never gate progress).
ALTER TABLE `subscription_document` ADD COLUMN `last_viewed_at` integer;
ALTER TABLE `subscription_document` ADD COLUMN `downloaded_at` integer;
ALTER TABLE `subscription_document` ADD COLUMN `opened_count` integer DEFAULT 0 NOT NULL;

-- Backfill countersign defaults. GP countersigns the operative agreements;
-- questionnaire / tax form / wire instructions auto-execute once the investor signs
-- (wire instructions are informational — signature_required is already 0).
UPDATE `document_template`
SET `countersign_required` = CASE `document_type`
  WHEN 'subscription_agreement' THEN 1
  WHEN 'operating_agreement' THEN 1
  ELSE 0
END;

UPDATE `subscription_document`
SET `requires_countersign` = CASE `document_type`
  WHEN 'subscription_agreement' THEN 1
  WHEN 'operating_agreement' THEN 1
  ELSE 0
END;
