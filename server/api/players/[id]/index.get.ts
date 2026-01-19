import { eq } from "drizzle-orm";

import { db } from "~server/db";
import { players } from "~server/db/schema";

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event);
  const playerId = Number(id);

  if (Number.isNaN(playerId)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid player ID",
    });
  }

  const player = await db
    .select({
      id: players.id,
      name: players.name,
      huntId: players.huntId,
    })
    .from(players)
    .where(eq(players.id, playerId))
    .limit(1);

  if (!player || player.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "Player not found",
    });
  }

  return player[0];
});
