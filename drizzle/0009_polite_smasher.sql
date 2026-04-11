CREATE TABLE `admin_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` text NOT NULL,
	`name` varchar(255) NOT NULL,
	`role` enum('super_admin','admin') DEFAULT 'admin',
	`is_active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`last_login` timestamp,
	CONSTRAINT `admin_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_users_email_unique` UNIQUE(`email`)
);
