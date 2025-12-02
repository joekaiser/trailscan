import { eq } from "drizzle-orm";
import { db } from "~server/db";
import { hunts } from "~server/db/schema";

export default defineEventHandler(async (event) => {
  const { id: shortCode } = getRouterParams(event);
  const hunt = await db.selectDistinct().from(hunts).where(eq(hunts.shortCode, shortCode));
  if (!hunt?.length) {
    throw createError({
      statusCode: 404,
      statusMessage: "Hunt not found",
    });
  }
  return hunt[0];
});