CREATE TABLE `events` (
	`id` varchar(255) NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`image` text,
	`date` varchar(50) NOT NULL,
	`time` varchar(50) NOT NULL,
	`venue` text NOT NULL,
	`city` varchar(100) NOT NULL,
	`citySlug` varchar(100) NOT NULL,
	`category` varchar(100) NOT NULL,
	`price` varchar(50),
	`interested` int DEFAULT 0,
	`tags` text,
	`slug` varchar(255) NOT NULL,
	`isFeatured` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `events_id` PRIMARY KEY(`id`),
	CONSTRAINT `events_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `notificationPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`cities` text,
	`categories` text,
	`emailNotifications` int DEFAULT 1,
	`frequency` enum('daily','weekly','immediately') DEFAULT 'weekly',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notificationPreferences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `notificationPreferences` ADD CONSTRAINT `notificationPreferences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;