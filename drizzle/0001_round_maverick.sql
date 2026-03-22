CREATE TABLE `savedEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`eventId` varchar(255) NOT NULL,
	`eventTitle` text,
	`eventDate` varchar(100),
	`eventCity` varchar(100) NOT NULL,
	`savedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `savedEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `savedEvents` ADD CONSTRAINT `savedEvents_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;