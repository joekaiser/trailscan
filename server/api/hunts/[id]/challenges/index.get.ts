import { eq } from "drizzle-orm";

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

  // Return all challenges - regular ones ordered by order, bonus codes at the end
  // Frontend will filter/separate them based on isBonus field
  const data = await db.select().from(challenges).where(eq(challenges.huntId, huntId));

  // Sort: regular challenges by order, then bonus codes
  return data.sort((a, b) => {
    if (a.isBonus && !b.isBonus)
      return 1;
    if (!a.isBonus && b.isBonus)
      return -1;
    if (a.isBonus && b.isBonus)
      return 0; // Bonus codes maintain creation order
    return (a.order ?? 0) - (b.order ?? 0);
  });
});
