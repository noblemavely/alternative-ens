ALTER TABLE `projects` MODIFY COLUMN `clientContactId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` DROP COLUMN `clientId`;