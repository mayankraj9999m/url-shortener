ALTER TABLE `short_links_table` DROP FOREIGN KEY `short_links_table_user_id_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `short_links_table` ADD CONSTRAINT `short_links_table_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;