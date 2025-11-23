CREATE TABLE `resumes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`resumeText` text NOT NULL,
	`jobDescription` text NOT NULL,
	`generatedContent` text NOT NULL,
	`customItems` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `resumes_id` PRIMARY KEY(`id`)
);
