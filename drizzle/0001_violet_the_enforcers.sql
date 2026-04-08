CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(20),
	`companyName` varchar(255),
	`companyWebsite` varchar(255),
	`contactPerson` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expertEducation` (
	`id` int AUTO_INCREMENT NOT NULL,
	`expertId` int NOT NULL,
	`schoolName` varchar(255) NOT NULL,
	`degree` varchar(255) NOT NULL,
	`fieldOfStudy` varchar(255),
	`startDate` varchar(10),
	`endDate` varchar(10),
	`description` longtext,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `expertEducation_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expertEmployment` (
	`id` int AUTO_INCREMENT NOT NULL,
	`expertId` int NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`position` varchar(255) NOT NULL,
	`startDate` varchar(10),
	`endDate` varchar(10),
	`isCurrent` boolean NOT NULL DEFAULT false,
	`description` longtext,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `expertEmployment_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expertVerification` (
	`id` int AUTO_INCREMENT NOT NULL,
	`expertId` int NOT NULL,
	`token` varchar(255) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `expertVerification_id` PRIMARY KEY(`id`),
	CONSTRAINT `expertVerification_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `experts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(20),
	`firstName` varchar(255),
	`lastName` varchar(255),
	`sector` varchar(255),
	`function` varchar(255),
	`biography` longtext,
	`linkedinUrl` varchar(500),
	`cvUrl` varchar(500),
	`cvKey` varchar(500),
	`isVerified` boolean NOT NULL DEFAULT false,
	`verificationToken` varchar(255),
	`verificationTokenExpiry` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `experts_id` PRIMARY KEY(`id`),
	CONSTRAINT `experts_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` longtext,
	`projectType` enum('Call','Advisory','ID') NOT NULL,
	`targetCompanies` text,
	`targetPersona` text,
	`hourlyRate` decimal(10,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `screeningQuestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`question` longtext NOT NULL,
	`order` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `screeningQuestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shortlists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`expertId` int NOT NULL,
	`status` enum('pending','interested','rejected') NOT NULL DEFAULT 'pending',
	`notes` longtext,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shortlists_id` PRIMARY KEY(`id`)
);
