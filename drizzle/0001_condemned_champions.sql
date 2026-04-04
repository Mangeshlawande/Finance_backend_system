CREATE TABLE "records" (
	"id" serial PRIMARY KEY NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"type" varchar(20) NOT NULL,
	"category" varchar(50) DEFAULT 'other' NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"description" varchar(500),
	"created_by" integer NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
