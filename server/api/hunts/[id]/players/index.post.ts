import { and, eq } from "drizzle-orm";

import { db } from "~server/db";
import { challenges, hunts, playerChallenges, players } from "~server/db/schema";

export default defineEventHandler(async (event) => {
  const body = await readBody<{ name: string }>(event);
  const params = getRouterParams(event);
  const shortCode = params.id;

  if (!body.name?.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: "Name is required",
    });
  }

  const hunt = await db.selectDistinct().from(hunts).where(eq(hunts.shortCode, shortCode));
  if (!hunt || hunt.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "Hunt not found",
    });
  }
  const huntId = hunt[0]!.id;

  const newPlayer = await db.insert(players).values({
    huntId,
    name: body.name.trim(),
  }).returning();

  const playerId = newPlayer[0]!.id;

  // Find the first challenge (order=0 or null, non-bonus) and automatically check it in
  const allChallenges = await db
    .select()
    .from(challenges)
    .where(
      and(
        eq(challenges.huntId, huntId),
        eq(challenges.isBonus, false),
      ),
    );

  // Find the first challenge (order=0 or null, sorted by order)
  const firstChallenge = allChallenges
    .filter(c => c.order === 0 || c.order === null)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0];

  if (firstChallenge) {
    const challengeId = firstChallenge.id;

    // Create check-in record for first challenge
    await db.insert(playerChallenges).values({
      playerId,
      currentChallengeId: challengeId,
    });

    // Update player score
    await db
      .update(players)
      .set({ score: 0 })
      .where(eq(players.id, playerId));
  }

  return newPlayer[0];
});
