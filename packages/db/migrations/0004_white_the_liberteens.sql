PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_investment` (
	`id` text PRIMARY KEY NOT NULL,
	`deal_id` text NOT NULL,
	`user_id` text NOT NULL,
	`committed_amount` real NOT NULL,
	`committed_date` integer NOT NULL,
	`funded_amount` real DEFAULT 0,
	`current_value` real,
	`distributions` real DEFAULT 0,
	`status` text DEFAULT 'committed' NOT NULL,
	`ownership_percentage` real,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`deal_id`) REFERENCES `deal`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
INSERT INTO `__new_investment`("id", "deal_id", "user_id", "committed_amount", "committed_date", "funded_amount", "current_value", "distributions", "status", "ownership_percentage", "created_at", "updated_at") SELECT "id", "deal_id", "user_id", "committed_amount", "committed_date", "funded_amount", "current_value", "distributions", CASE WHEN "status" = 'active' THEN 'funded' ELSE "status" END, "ownership_percentage", "created_at", "updated_at" FROM `investment`;--> statement-breakpoint
DROP TABLE `investment`;--> statement-breakpoint
ALTER TABLE `__new_investment` RENAME TO `investment`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `investment_deal_user_uniq` ON `investment` (`deal_id`,`user_id`);
