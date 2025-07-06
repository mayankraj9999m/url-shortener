CREATE TABLE `short_links_table` (
	`serial_no` int AUTO_INCREMENT NOT NULL,
	`url` varchar(255) NOT NULL,
	`short_code` varchar(20) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`user_id` int NOT NULL,
	CONSTRAINT `short_links_table_serial_no` PRIMARY KEY(`serial_no`),
	CONSTRAINT `short_links_table_short_code_unique` UNIQUE(`short_code`)
);
--> statement-breakpoint
ALTER TABLE `short_links_table` ADD CONSTRAINT `short_links_table_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;