import { and, desc, eq } from "drizzle-orm";

import { db } from "~server/db";
import { challenges, playerChallenges, players } from "~server/db/schema";

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event);
  const huntId = Number(id);

  if (isNaN(huntId)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid hunt ID",
    });
  }

  // Get the last regular challenge (highest order, isBonus = false)
  const lastChallenge = await db
    .select()
    .from(challenges)
    .where(and(
      eq(challenges.huntId, huntId),
      eq(challenges.isBonus, false),
    ))
    .orderBy(desc(challenges.order))
    .limit(1);

  if (!lastChallenge || lastChallenge.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "No regular challenges found for this hunt",
    });
  }

  const lastChallengeId = lastChallenge[0]!.id;

  // Find all players who have checked in to the last challenge
  const eligiblePlayers = await db
    .selectDistinct({
      id: players.id,
      name: players.name,
      score: players.score,
    })
    .from(players)
    .innerJoin(playerChallenges, eq(players.id, playerChallenges.playerId))
    .where(eq(playerChallenges.currentChallengeId, lastChallengeId));

  if (!eligiblePlayers || eligiblePlayers.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "No players have completed the last challenge yet",
    });
  }

  // Randomly select a winner
  const randomIndex = Math.floor(Math.random() * eligiblePlayers.length);
  const winner = eligiblePlayers[randomIndex]!;

  return winner;
});
