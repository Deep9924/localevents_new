CREATE TABLE `organizers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`description` text,
	`image` text,
	`website` text,
	`city` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `events` ADD `organizerId` int;--> statement-breakpoint
ALTER TABLE `events` ADD CONSTRAINT `events_organizerId_organizers_id_fk` FOREIGN KEY (`organizerId`) REFERENCES `organizers`(`id`) ON DELETE set null ON UPDATE no action;