CREATE TABLE `engagement_timeline` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` int NOT NULL,
	`expert_id` int NOT NULL,
	`status` enum('contacted','attempting_contact','qualified','proposal_sent','engaged','rejected','completed') NOT NULL DEFAULT 'contacted',
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `engagement_timeline_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `engagement_timeline` ADD CONSTRAINT `engagement_timeline_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `engagement_timeline` ADD CONSTRAINT `engagement_timeline_expert_id_experts_id_fk` FOREIGN KEY (`expert_id`) REFERENCES `experts`(`id`) ON DELETE no action ON UPDATE no action;