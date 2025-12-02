import { humanId } from "human-id";
import { db } from "~server/db";
import { hunts } from "~server/db/schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { name } = body;
  if (!name?.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: "Name is required",
    });
  }

  let tryCreate = true;
  let shortCode = "";
  let tries = 0;
  while (tryCreate && tries < 10) {
    shortCode = humanId({
      separator: "-",
      capitalize: false,
    });
    const existingHunt = await db.selectDistinct().from(hunts).where(eq(hunts.shortCode, shortCode));
    if (!existingHunt?.length) {
      tryCreate = false;
    }
    tries++;
  }

  if (tries >= 10) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create short code",
    });
  }

  const hunt = await db.insert(hunts).values({
    name,
    shortCode,
  }).returning();
  return hunt[0];
});

