ALTER TABLE `chat` ADD `deal_id` text;--> statement-breakpoint
CREATE INDEX `chat_dealId_idx` ON `chat` (`deal_id`);--> statement-breakpoint
CREATE TABLE `knowledge_request` (
	`id` text PRIMARY KEY NOT NULL,
	`deal_id` text NOT NULL,
	`asked_by_user_id` text NOT NULL,
	`chat_id` text,
	`reference_code` text NOT NULL,
	`title` text NOT NULL,
	`question` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`deal_id`) REFERENCES `deal`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`asked_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`chat_id`) REFERENCES `chat`(`id`) ON UPDATE no action ON DELETE set null
);--> statement-breakpoint
CREATE UNIQUE INDEX `knowledge_request_reference_code_uidx` ON `knowledge_request` (`reference_code`);--> statement-breakpoint
CREATE INDEX `knowledge_request_dealId_status_idx` ON `knowledge_request` (`deal_id`,`status`);--> statement-breakpoint
CREATE INDEX `knowledge_request_askedBy_idx` ON `knowledge_request` (`asked_by_user_id`);--> statement-breakpoint
CREATE INDEX `knowledge_request_chatId_idx` ON `knowledge_request` (`chat_id`);--> statement-breakpoint
CREATE TABLE `knowledge_answer` (
	`id` text PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`answer` text NOT NULL,
	`answered_by_user_id` text NOT NULL,
	`verified` integer DEFAULT true NOT NULL,
	`published_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`request_id`) REFERENCES `knowledge_request`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`answered_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
CREATE UNIQUE INDEX `knowledge_answer_request_id_unique` ON `knowledge_answer` (`request_id`);--> statement-breakpoint
CREATE INDEX `knowledge_answer_requestId_idx` ON `knowledge_answer` (`request_id`);--> statement-breakpoint
CREATE INDEX `knowledge_answer_answeredBy_idx` ON `knowledge_answer` (`answered_by_user_id`);
