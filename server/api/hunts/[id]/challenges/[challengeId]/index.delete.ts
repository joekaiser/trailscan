import { and, eq } from "drizzle-orm";
import { db } from "~server/db";
import { challenges, hunts } from "~server/db/schema";

export default defineEventHandler(async (event) => {
  const params = getRouterParams(event);
  const shortCode = params.id;
  const challengeId = parseInt(params.challengeId);

  if (isNaN(challengeId)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid challenge ID",
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

  // Delete the challenge
  await db.delete(challenges).where(eq(challenges.id, challengeId));

  return { success: true };
});

