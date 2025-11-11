CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	`masterPasswordHash` varchar(255),
	`passwordSalt` varchar(255),
	`encryptedVaultKey` text,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
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
	`credentialId` varchar(512) NOT NULL,
	`publicKey` text NOT NULL,
	`counter` int NOT NULL DEFAULT 0,
	`transports` text,
	`name` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastUsed` timestamp,
	CONSTRAINT `webauthn_credentials_id` PRIMARY KEY(`id`),
	CONSTRAINT `webauthn_credentials_credentialId_unique` UNIQUE(`credentialId`)
);
