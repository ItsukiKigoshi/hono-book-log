CREATE TABLE `books` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`comment` text,
	`is_favorite` integer DEFAULT false,
	`status` text DEFAULT 'toRead',
	`created_at` integer,
	`updated_at` integer
);
