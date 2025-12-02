CREATE TABLE "challenges" (
	"id" serial PRIMARY KEY NOT NULL,
	"hunt_id" integer,
	"name" varchar(255) NOT NULL,
	"content" text,
	"previous_challenge_id" integer
);
--> statement-breakpoint
CREATE TABLE "hunts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false,
	"short_code" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_challenges" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer,
	"current_challenge_id" integer
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" serial PRIMARY KEY NOT NULL,
	"hunt_id" integer,
	"name" varchar(255) NOT NULL,
	"score" integer DEFAULT 0,
	"is_completed" boolean DEFAULT false
);
--> statement-breakpoint
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_hunt_id_hunts_id_fk" FOREIGN KEY ("hunt_id") REFERENCES "public"."hunts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_previous_challenge_id_challenges_id_fk" FOREIGN KEY ("previous_challenge_id") REFERENCES "public"."challenges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_challenges" ADD CONSTRAINT "player_challenges_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_challenges" ADD CONSTRAINT "player_challenges_current_challenge_id_challenges_id_fk" FOREIGN KEY ("current_challenge_id") REFERENCES "public"."challenges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_hunt_id_hunts_id_fk" FOREIGN KEY ("hunt_id") REFERENCES "public"."hunts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "challenges_hunt_id_idx" ON "challenges" USING btree ("hunt_id");--> statement-breakpoint
CREATE INDEX "challenges_previous_challenge_id_idx" ON "challenges" USING btree ("previous_challenge_id");--> statement-breakpoint
CREATE UNIQUE INDEX "hunts_short_code_idx" ON "hunts" USING btree ("short_code");--> statement-breakpoint
CREATE INDEX "player_challenges_player_id_idx" ON "player_challenges" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "player_challenges_current_challenge_id_idx" ON "player_challenges" USING btree ("current_challenge_id");--> statement-breakpoint
CREATE INDEX "players_hunt_id_idx" ON "players" USING btree ("hunt_id");