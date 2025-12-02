<script setup lang="ts">
import type { Player } from "~server/db/schema";

const props = defineProps<{
  huntId: number;
}>();

const playersApi = usePlayersApi();
const { data: leaderboard, error: leaderboardError, pending } = await playersApi.getLeaderboard(props.huntId);

const formatRank = (rank: number): string => {
  const suffix = rank === 1 ? 'st' : rank === 2 ? 'nd' : rank === 3 ? 'rd' : 'th';
  return `${rank}${suffix}`;
};
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Leaderboard</CardTitle>
      <CardDescription>Top 50 players</CardDescription>
    </CardHeader>
    <CardContent>
      <div v-if="pending" class="flex flex-col items-center justify-center py-8">
        <Spinner />
        <p class="text-muted-foreground mt-4">Loading leaderboard...</p>
      </div>

      <div v-else-if="leaderboardError" class="text-sm text-destructive py-4">
        {{ leaderboardError.message || 'Failed to load leaderboard' }}
      </div>

      <div v-else-if="!leaderboard || leaderboard.length === 0" class="text-muted-foreground py-4">
        No players yet. Be the first to join!
      </div>

      <div v-else class="space-y-2">
        <div v-for="(player, index) in leaderboard" :key="player.id"
          class="flex items-center justify-between p-3 rounded-lg border" :class="{
            'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800': index === 0,
            'bg-gray-50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-800': index === 1,
            'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800': index === 2,
          }">
          <div class="flex items-center gap-4">
            <div class="flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm" :class="{
              'bg-yellow-500 text-yellow-950': index === 0,
              'bg-gray-400 text-gray-950': index === 1,
              'bg-orange-500 text-orange-950': index === 2,
              'bg-muted text-muted-foreground': index > 2,
            }">
              {{ index + 1 }}
            </div>
            <span class="font-medium">{{ player.name }}</span>
          </div>
          <div class="text-right">
            <div class="text-sm text-muted-foreground">Score</div>
            <div class="text-lg font-bold">{{ player.score ?? 0 }}</div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
