import { eq } from "drizzle-orm";

import { db } from "~server/db";
import { hunts, players } from "~server/db/schema";

export default defineEventHandler(async (event) => {
  const params = getRouterParams(event);
  const shortCode = params.id;

  // Validate hunt exists
  const hunt = await db.selectDistinct().from(hunts).where(eq(hunts.shortCode, shortCode));
  if (!hunt || hunt.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "Hunt not found",
    });
  }
  const huntId = hunt[0]!.id;

  // Delete all players for this hunt
  // This will cascade delete all playerChallenges records due to the schema foreign key constraint
  await db.delete(players).where(eq(players.huntId, huntId));

  return { success: true };
});

