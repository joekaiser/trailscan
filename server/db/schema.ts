import type { AnyPgColumn } from "drizzle-orm/pg-core";

import { boolean, index, integer, numeric, pgEnum, pgTable, serial, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

export const hunts = pgTable("hunts", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isDeleted: boolean("is_deleted").default(false),
  shortCode: varchar("short_code", { length: 255 }).notNull(),
  guidelines: text("guidelines"),
}, table => [
  uniqueIndex("hunts_short_code_idx").on(table.shortCode),
]);

export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  huntId: integer("hunt_id").references(() => hunts.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  content: text("content"),
  order: integer("order").default(0),
  previousChallengeId: integer("previous_challenge_id").references((): AnyPgColumn => challenges.id, { onDelete: "restrict" }),
  publicId: varchar("public_id", { length: 255 }).notNull(),
  isBonus: boolean("is_bonus").default(false),
}, table => [
  index("challenges_hunt_id_idx").on(table.huntId),
  index("challenges_previous_challenge_id_idx").on(table.previousChallengeId),
  index("challenges_public_id_idx").on(table.publicId),
]);

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  huntId: integer("hunt_id").references(() => hunts.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  score: integer("score").default(0),
  isCompleted: boolean("is_completed").default(false),
}, table => [
  index("players_hunt_id_idx").on(table.huntId),
]);

export const playerChallenges = pgTable("player_challenges", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").references(() => players.id, { onDelete: "cascade" }),
  currentChallengeId: integer("current_challenge_id").references(() => challenges.id, { onDelete: "restrict" }),
  checkedInAt: timestamp("checked_in_at").defaultNow().notNull(),
}, table => [
  index("player_challenges_player_id_idx").on(table.playerId),
  index("player_challenges_current_challenge_id_idx").on(table.currentChallengeId),
]);

// Export inferred types
export type Hunt = typeof hunts.$inferSelect;
export type NewHunt = typeof hunts.$inferInsert;
export type Challenge = typeof challenges.$inferSelect;
export type NewChallenge = typeof challenges.$inferInsert;
export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;
export type PlayerChallenge = typeof playerChallenges.$inferSelect;
export type NewPlayerChallenge = typeof playerChallenges.$inferInsert;
