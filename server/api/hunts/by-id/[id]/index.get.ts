import { eq } from "drizzle-orm";
import { db } from "~server/db";
import { hunts } from "~server/db/schema";

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event);
  const huntId = Number(id);

  if (isNaN(huntId)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid hunt ID",
    });
  }

  const hunt = await db.selectDistinct().from(hunts).where(eq(hunts.id, huntId));
  if (!hunt?.length) {
    throw createError({
      statusCode: 404,
      statusMessage: "Hunt not found",
    });
  }
  return hunt[0];
});

