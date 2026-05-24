CREATE TABLE `daily_articles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contentDate` varchar(10) NOT NULL,
	`title` varchar(512) NOT NULL,
	`titleZh` varchar(512) NOT NULL,
	`content` text NOT NULL,
	`contentZh` text NOT NULL,
	`articleType` enum('news','novel','blog','professional','social') NOT NULL,
	`difficulty` enum('beginner','intermediate','advanced') NOT NULL DEFAULT 'intermediate',
	`keyWords` text,
	`learningTips` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `daily_articles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `daily_content_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scheduleCronTaskUid` varchar(65),
	`contentDate` varchar(10) NOT NULL,
	`status` enum('pending','running','completed','failed') NOT NULL DEFAULT 'pending',
	`articlesGenerated` int DEFAULT 0,
	`vocabularyGenerated` int DEFAULT 0,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `daily_content_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `daily_vocabulary` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contentDate` varchar(10) NOT NULL,
	`word` varchar(128) NOT NULL,
	`pronunciation` varchar(256),
	`meaning` text NOT NULL,
	`wordType` enum('slang','internet','youth','formal','expression') NOT NULL DEFAULT 'youth',
	`exampleSentence` text NOT NULL,
	`exampleTranslation` text NOT NULL,
	`culturalNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `daily_vocabulary_id` PRIMARY KEY(`id`)
);
