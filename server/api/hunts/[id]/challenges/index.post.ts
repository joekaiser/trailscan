import { eq, max } from "drizzle-orm";
import { db } from "~server/db";
import { challenges, hunts, NewChallenge } from "~server/db/schema";
import { nanoid } from "nanoid";

export default defineEventHandler(async (event) => {
  const challenge = await readBody<NewChallenge>(event)
  const params = getRouterParams(event);
  const shortCode = params.id;

  if (!challenge.name?.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: "Name is required",
    });
  }

  const hunt = await db.selectDistinct().from(hunts).where(eq(hunts.shortCode, shortCode));
  if (!hunt) {
    throw createError({
      statusCode: 404,
      statusMessage: "Hunt not found",
    });
  }
  const huntId = hunt[0].id;

  // Get the maximum order value for challenges in this hunt
  const maxOrderResult = await db
    .select({ maxOrder: max(challenges.order) })
    .from(challenges)
    .where(eq(challenges.huntId, huntId));

  // Set order to be the last one (maxOrder + 1, or 0 if no challenges exist)
  const newOrder = maxOrderResult[0]?.maxOrder !== null ? (maxOrderResult[0]!.maxOrder! + 1) : 0;

  const publicId = nanoid(10);

  const newChallenge = await db.insert(challenges).values(
    {
      publicId,
      huntId,
      name: challenge.name.trim(),
      content: challenge.content?.trim(),
      previousChallengeId: challenge.previousChallengeId,
      order: newOrder,
    }
  ).returning();
  return newChallenge;
});