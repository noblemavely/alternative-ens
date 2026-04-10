CREATE TABLE `clientContacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`contactName` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(20),
	`role` varchar(255),
	`workType` varchar(255),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clientContacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `expertEducation` MODIFY COLUMN `degree` varchar(255);--> statement-breakpoint
ALTER TABLE `projects` ADD `clientContactId` int;