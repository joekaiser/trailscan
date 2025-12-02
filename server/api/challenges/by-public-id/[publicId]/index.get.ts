import { eq } from "drizzle-orm";
import { db } from "~server/db";
import { challenges } from "~server/db/schema";

export default defineEventHandler(async (event) => {
  const params = getRouterParams(event);
  const publicId = params.publicId;

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

  return challenge[0];
});

