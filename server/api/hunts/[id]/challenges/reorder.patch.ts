import { and, eq, inArray } from "drizzle-orm";
import { db } from "~server/db";
import { challenges, hunts } from "~server/db/schema";

export default defineEventHandler(async (event) => {
  const body = await readBody<{ challengeIds: number[] }>(event);
  const params = getRouterParams(event);
  const shortCode = params.id;

  if (!body.challengeIds || !Array.isArray(body.challengeIds) || body.challengeIds.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "challengeIds array is required",
    });
  }

  // Find the hunt by shortCode
  const hunt = await db.selectDistinct().from(hunts).where(eq(hunts.shortCode, shortCode));
  if (!hunt || hunt.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "Hunt not found",
    });
  }
  const huntId = hunt[0].id;

  // Verify all challenges belong to this hunt
  const existingChallenges = await db.select().from(challenges).where(
    and(
      inArray(challenges.id, body.challengeIds),
      eq(challenges.huntId, huntId)
    )
  );

  if (existingChallenges.length !== body.challengeIds.length) {
    throw createError({
      statusCode: 400,
      statusMessage: "Some challenges do not belong to this hunt",
    });
  }

  // Update order for each challenge in a transaction
  const updates = body.challengeIds.map((challengeId, index) => {
    return db.update(challenges)
      .set({ order: index })
      .where(eq(challenges.id, challengeId));
  });

  // Execute all updates
  await Promise.all(updates);

  // Return updated challenges in new order
  const updated = await db.select().from(challenges).where(
    and(
      inArray(challenges.id, body.challengeIds),
      eq(challenges.huntId, huntId)
    )
  ).orderBy(challenges.order);

  return updated;
});

