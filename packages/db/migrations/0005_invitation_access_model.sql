-- Migrate clearance statuses to new global approval values
UPDATE `investor_clearance` SET `status` = 'pending_review' WHERE `status` = 'pending';
--> statement-breakpoint
UPDATE `investor_clearance` SET `status` = 'approved' WHERE `status` = 'cleared';
--> statement-breakpoint
UPDATE `investor_clearance` SET `status` = 'needs_information' WHERE `status` = 'cleared_with_conditions';
--> statement-breakpoint
-- Rebuild vehicle_permission with access_level instead of four boolean flags
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_vehicle_permission` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`deal_id` text NOT NULL,
	`access_level` text DEFAULT 'teaser' NOT NULL,
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
INSERT INTO `__new_vehicle_permission` (
	`id`, `user_id`, `deal_id`, `access_level`, `granted_by`, `granted_at`, `notes`,
	`revoked_at`, `revoked_by`, `revoke_reason`, `created_at`, `updated_at`
)
SELECT
	`id`,
	`user_id`,
	`deal_id`,
	CASE
		WHEN `can_view_documents` = 1 OR `can_invest` = 1 THEN 'data_room'
		ELSE 'teaser'
	END,
	`granted_by`,
	`granted_at`,
	`notes`,
	`revoked_at`,
	`revoked_by`,
	`revoke_reason`,
	`created_at`,
	`updated_at`
FROM `vehicle_permission`;
--> statement-breakpoint
DROP TABLE `vehicle_permission`;--> statement-breakpoint
ALTER TABLE `__new_vehicle_permission` RENAME TO `vehicle_permission`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `vehicle_permission_userId_idx` ON `vehicle_permission` (`user_id`);--> statement-breakpoint
CREATE INDEX `vehicle_permission_dealId_idx` ON `vehicle_permission` (`deal_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `vehicle_permission_user_deal_active_uniq` ON `vehicle_permission` (`user_id`,`deal_id`);
