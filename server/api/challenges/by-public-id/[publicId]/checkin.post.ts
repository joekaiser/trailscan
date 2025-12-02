import { eq, and, count, desc } from "drizzle-orm";
import { db } from "~server/db";
import { challenges, players, playerChallenges } from "~server/db/schema";

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
    playerData = typeof playerCookieValue === 'string' 
      ? JSON.parse(playerCookieValue) 
      : playerCookieValue;
  } catch (e) {
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
        eq(playerChallenges.currentChallengeId, challengeData.id)
      )
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

  // Check if player is checking in out of order
  // Get all challenges the player has checked into, ordered by challenge order
  const playerCheckins = await db
    .select({
      challengeId: playerChallenges.currentChallengeId,
      challengeOrder: challenges.order,
    })
    .from(playerChallenges)
    .innerJoin(challenges, eq(playerChallenges.currentChallengeId, challenges.id))
    .where(eq(playerChallenges.playerId, playerData.playerId))
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
  } else {
    // First check-in - verify it's the first challenge (order 0)
    const currentChallengeOrder = challengeData.order ?? 0;
    if (currentChallengeOrder !== 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "You scanned the incorrect code. Please scan challenges in order.",
      });
    }
  }

  // Count how many players have already checked into this challenge
  const checkinCount = await db
    .select({ count: count() })
    .from(playerChallenges)
    .where(eq(playerChallenges.currentChallengeId, challengeData.id));

  const position = (checkinCount[0]?.count ?? 0) + 1;

  // Calculate points: 10, 9, 8, 7, 6, then 5 for everyone else
  let pointsAwarded = 5;
  if (position === 1) pointsAwarded = 10;
  else if (position === 2) pointsAwarded = 9;
  else if (position === 3) pointsAwarded = 8;
  else if (position === 4) pointsAwarded = 7;
  else if (position === 5) pointsAwarded = 6;

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

