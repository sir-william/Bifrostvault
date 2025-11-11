CREATE TABLE `vault_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('login','note','card','identity') NOT NULL DEFAULT 'login',
	`encryptedName` text NOT NULL,
	`encryptedUsername` text,
	`encryptedPassword` text,
	`encryptedUrl` text,
	`encryptedNotes` text,
	`encryptedCustomFields` text,
	`isFavorite` boolean NOT NULL DEFAULT false,
	`folder` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastAccessed` timestamp,
	CONSTRAINT `vault_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `webauthn_credentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`credentialId` text NOT NULL,
	`publicKey` text NOT NULL,
	`counter` int NOT NULL DEFAULT 0,
	`transports` text,
	`name` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastUsed` timestamp,
	CONSTRAINT `webauthn_credentials_id` PRIMARY KEY(`id`),
	CONSTRAINT `webauthn_credentials_credentialId_unique` UNIQUE(`credentialId`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `masterPasswordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordSalt` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `encryptedVaultKey` text;