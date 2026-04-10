CREATE TABLE `expertClientMapping` (
	`id` int AUTO_INCREMENT NOT NULL,
	`expertId` int NOT NULL,
	`clientId` int NOT NULL,
	`status` enum('shortlisted','contacted','attempting_contact','engaged','qualified','proposal_sent','negotiation','verbal_agreement','closed_won','closed_lost') NOT NULL DEFAULT 'shortlisted',
	`notes` longtext,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `expertClientMapping_id` PRIMARY KEY(`id`)
);
