import { eq } from "drizzle-orm";

import { db } from "~server/db";
import { hunts } from "~server/db/schema";

export default defineEventHandler(async (event) => {
  const { id: shortCode } = getRouterParams(event);
  const body = await readBody<{ name?: string; guidelines?: string | null }>(event);

  const hunt = await db.selectDistinct().from(hunts).where(eq(hunts.shortCode, shortCode));
  if (!hunt?.length) {
    throw createError({
      statusCode: 404,
      statusMessage: "Hunt not found",
    });
  }

  const updateData: { name?: string; guidelines?: string | null; updatedAt?: Date } = {
    updatedAt: new Date(),
  };

  if (body.name !== undefined) {
    updateData.name = body.name.trim();
  }

  if (body.guidelines !== undefined) {
    updateData.guidelines = body.guidelines?.trim() || null;
  }

  const updatedHunt = await db
    .update(hunts)
    .set(updateData)
    .where(eq(hunts.shortCode, shortCode))
    .returning();

  return updatedHunt[0];
});
