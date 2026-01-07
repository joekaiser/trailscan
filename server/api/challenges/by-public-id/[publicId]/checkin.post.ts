import { and, count, desc, eq } from "drizzle-orm";

import { db } from "~server/db";
import { challenges, playerChallenges, players } from "~server/db/schema";

export default defineEventHandler(async (event) => {
  const params = getRouterParams(event);
  const publicId = params.publicId;

  // Get player info from cookie
  const cookies = parseCookies(event);
  let playerData: { huntId: number; playerId: number; playerName: string } | null = null;

  // Try to find player cookie - need to check all possible hunt cookies
  // Since we don't know the huntId yet, we'll get it from the challenge first
  const challenge = await db
    .select()
    .from(challenges)
    .where(eq(challenges.publicId, publicId))
    .limit(1);

  if (!challenge || challenge.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "Challenge not found",
    });
  }

  const challengeData = challenge[0];
  const huntId = challengeData.huntId;

  if (!huntId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Challenge is not associated with a hunt",
    });
  }

  // Get player cookie for this hunt
  const cookieKey = `Trailhunt:${huntId}`;
  const playerCookieValue = cookies[cookieKey];

  if (!playerCookieValue) {
    throw createError({
      statusCode: 401,
      statusMessage: "Player not registered. Please join the game first.",
    });
  }

  try {
    playerData = typeof playerCookieValue === "string"
      ? JSON.parse(playerCookieValue)
      : playerCookieValue;
  }
  catch {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid player cookie",
    });
  }

  if (!playerData || !playerData.playerId || !playerData.huntId) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid player data",
    });
  }

  // Verify player exists
  const player = await db
    .select()
    .from(players)
    .where(eq(players.id, playerData.playerId))
    .limit(1);

  if (!player || player.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "Player not found",
    });
  }

  const playerRecord = player[0];

  // Check if player has already checked into this challenge
  const existingCheckin = await db
    .select()
    .from(playerChallenges)
    .where(
      and(
        eq(playerChallenges.playerId, playerData.playerId),
        eq(playerChallenges.currentChallengeId, challengeData.id),
      ),
    )
    .limit(1);

  if (existingCheckin && existingCheckin.length > 0) {
    // Already checked in, return existing data
    return {
      success: true,
      alreadyCheckedIn: true,
      pointsAwarded: 0,
      totalPoints: playerRecord.score,
      position: null,
    };
  }

  // Skip order validation for bonus codes - they can be scanned at any time
  if (!(challengeData as { isBonus?: boolean }).isBonus) {
    // Check if player is checking in out of order
    // Get all NON-BONUS challenges the player has checked into, ordered by challenge order
    // Bonus challenges should not affect the order sequence
    const playerCheckins = await db
      .select({
        challengeId: playerChallenges.currentChallengeId,
        challengeOrder: challenges.order,
      })
      .from(playerChallenges)
      .innerJoin(challenges, eq(playerChallenges.currentChallengeId, challenges.id))
      .where(
        and(
          eq(playerChallenges.playerId, playerData.playerId),
          eq(challenges.isBonus, false),
        ),
      )
      .orderBy(desc(challenges.order))
      .limit(1);

    // If player has checked in before, verify order
    if (playerCheckins && playerCheckins.length > 0) {
      const highestOrder = playerCheckins[0].challengeOrder ?? 0;
      const currentChallengeOrder = challengeData.order ?? 0;

      // Check if this challenge is the next one (order should be highestOrder + 1)
      if (currentChallengeOrder !== highestOrder + 1) {
        throw createError({
          statusCode: 400,
          statusMessage: "You scanned the incorrect code. Please scan challenges in order.",
        });
      }
    }
    else {
      // First check-in - verify it's the first challenge (order 0)
      const currentChallengeOrder = challengeData.order ?? 0;
      if (currentChallengeOrder !== 0) {
        throw createError({
          statusCode: 400,
          statusMessage: "You scanned the incorrect code. Please scan challenges in order.",
        });
      }
    }
  }

  // Count how many players have already checked into this challenge
  const checkinCount = await db
    .select({ count: count() })
    .from(playerChallenges)
    .where(eq(playerChallenges.currentChallengeId, challengeData.id));

  const position = (checkinCount[0]?.count ?? 0) + 1;

  // Roll two "dice" - creates natural bell curve with variance
  const die1 = Math.floor(Math.random() * 6) + 1; // 1-6
  const die2 = Math.floor(Math.random() * 6) + 1; // 1-6
  let pointsAwarded = die1 + die2 + 5; // 7-17 range, weighted toward middle (~12)

  // Rare multipliers
  const multiplierRoll = Math.random();
  if (multiplierRoll < 0.01) {
    // 1% chance: Double points!
    pointsAwarded *= 2;
  }
  else if (multiplierRoll < 0.03) {
    // 2% chance: 1.5x multiplier
    pointsAwarded = Math.floor(pointsAwarded * 1.5);
  }
  else if (multiplierRoll < 0.05) {
    // 2% chance: 0.5x penalty
    pointsAwarded = Math.floor(pointsAwarded * 0.5);
  }

  // Clamp between 7 and 18
  pointsAwarded = Math.max(7, Math.min(18, pointsAwarded));

  // Create check-in record
  await db.insert(playerChallenges).values({
    playerId: playerData.playerId,
    currentChallengeId: challengeData.id,
  });

  // Update player score
  const newScore = (playerRecord.score ?? 0) + pointsAwarded;
  await db
    .update(players)
    .set({ score: newScore })
    .where(eq(players.id, playerData.playerId));

  return {
    success: true,
    alreadyCheckedIn: false,
    pointsAwarded,
    totalPoints: newScore,
    position,
  };
});
