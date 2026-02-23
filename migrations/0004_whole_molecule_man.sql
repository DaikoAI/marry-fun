CREATE TABLE `xAccount` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`accountId` text NOT NULL,
	`providerAccountId` text NOT NULL,
	`username` text,
	`linkedAt` integer NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`accountId`) REFERENCES `account`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `x_account_user_id_unique` ON `xAccount` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX `x_account_account_id_unique` ON `xAccount` (`accountId`);--> statement-breakpoint
CREATE INDEX `x_account_provider_account_id_idx` ON `xAccount` (`providerAccountId`);