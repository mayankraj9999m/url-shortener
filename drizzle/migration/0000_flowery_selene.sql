CREATE TABLE `short_links_table` (
	`SERIAL NO.` int AUTO_INCREMENT NOT NULL,
	`URL` varchar(255) NOT NULL,
	`SHORT_CODE` varchar(20) NOT NULL,
	CONSTRAINT `short_links_table_SERIAL NO.` PRIMARY KEY(`SERIAL NO.`),
	CONSTRAINT `short_links_table_SHORT_CODE_unique` UNIQUE(`SHORT_CODE`)
);