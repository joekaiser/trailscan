import { eq } from "drizzle-orm";
import { db } from "~server/db";
import { hunts, players, NewPlayer } from "~server/db/schema";

export default defineEventHandler(async (event) => {
  const body = await readBody<{ name: string }>(event);
  const params = getRouterParams(event);
  const shortCode = params.id;

  if (!body.name?.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: "Name is required",
    });
  }

  const hunt = await db.selectDistinct().from(hunts).where(eq(hunts.shortCode, shortCode));
  if (!hunt || hunt.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "Hunt not found",
    });
  }
  const huntId = hunt[0]!.id;

  const newPlayer = await db.insert(players).values({
    huntId,
    name: body.name.trim(),
  }).returning();


  return newPlayer[0];
});

