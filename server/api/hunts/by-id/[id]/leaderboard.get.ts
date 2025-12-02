import { eq, desc } from "drizzle-orm";
import { db } from "~server/db";
import { players } from "~server/db/schema";

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event);
  const huntId = Number(id);

  if (isNaN(huntId)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid hunt ID",
    });
  }

  const leaderboard = await db
    .select({
      id: players.id,
      name: players.name,
      score: players.score,
    })
    .from(players)
    .where(eq(players.huntId, huntId))
    .orderBy(desc(players.score))
    .limit(50);

  return leaderboard;
});

