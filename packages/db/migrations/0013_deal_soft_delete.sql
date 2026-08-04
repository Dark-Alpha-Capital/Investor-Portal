-- Deal soft delete: records are preserved for audit/restore.
-- Only the admin "purge" path physically removes a deal (guarded against
-- any investment / chat / capital-notice references).

ALTER TABLE `deal` ADD COLUMN `deleted_at` integer;
ALTER TABLE `deal` ADD COLUMN `deleted_by` text REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null;
ALTER TABLE `deal` ADD COLUMN `deleted_reason` text;
CREATE INDEX `deal_deleted_at_idx` ON `deal` (`deleted_at`);
