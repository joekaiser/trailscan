import { eq, } from "drizzle-orm";
import { db } from "~server/db";
import { challenges, hunts } from "~server/db/schema";

export default defineEventHandler(async (event) => {
  const params = getRouterParams(event);
  const shortCode = params.id;

  const hunt = await db.selectDistinct().from(hunts).where(eq(hunts.shortCode, shortCode));
  if (!hunt) {
    throw createError({
      statusCode: 404,
      statusMessage: "Hunt not found",
    });
  }
  const huntId = hunt[0].id;

  const data = await db.select().from(challenges).where(eq(challenges.huntId, huntId)).orderBy(challenges.order);
  return data;
});