DROP TABLE `organizers`;--> statement-breakpoint
ALTER TABLE `events` DROP FOREIGN KEY `events_organizerId_organizers_id_fk`;
--> statement-breakpoint
ALTER TABLE `events` DROP COLUMN `organizerId`;