ALTER TABLE "challenges" ADD COLUMN "public_id" varchar(255) NOT NULL;--> statement-breakpoint
CREATE INDEX "challenges_public_id_idx" ON "challenges" USING btree ("public_id");