CREATE TABLE `totp_secrets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`secret` varchar(255) NOT NULL,
	`backupCodes` text,
	`enabled` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastUsed` timestamp,
	CONSTRAINT `totp_secrets_id` PRIMARY KEY(`id`)
);
