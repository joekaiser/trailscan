import { and, eq } from "drizzle-orm";
import { db } from "~server/db";
import { challenges, hunts } from "~server/db/schema";

export default defineEventHandler(async (event) => {
  const updateData = await readBody<{ name?: string; content?: string }>(event);
  const params = getRouterParams(event);
  const shortCode = params.id;
  const challengeId = parseInt(params.challengeId);

  if (isNaN(challengeId)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid challenge ID",
    });
  }

  if (updateData.name !== undefined && !updateData.name.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: "Name cannot be empty",
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

  // Verify the challenge belongs to this hunt
  const challenge = await db.select().from(challenges).where(
    and(
      eq(challenges.id, challengeId),
      eq(challenges.huntId, huntId)
    )
  );

  if (!challenge || challenge.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "Challenge not found",
    });
  }

  // Build update object
  const updateValues: { name?: string; content?: string } = {};
  if (updateData.name !== undefined) {
    updateValues.name = updateData.name.trim();
  }
  if (updateData.content !== undefined) {
    updateValues.content = updateData.content.trim() || null;
  }

  // Update the challenge
  const updated = await db.update(challenges)
    .set(updateValues)
    .where(eq(challenges.id, challengeId))
    .returning();

  return updated[0];
});

