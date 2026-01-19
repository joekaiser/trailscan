import type { Player } from "~server/db/schema";

export default function usePlayersApi() {
  async function create(shortCode: string, name: string) {
    const response = await useFetch<Player>(`/api/hunts/${shortCode}/players`, {
      method: "POST",
      body: { name },
    });
    return response;
  }

  async function getLeaderboard(huntId: number) {
    const response = await useFetch<Array<Pick<Player, "id" | "name" | "score">>>(
      `/api/hunts/by-id/${huntId}/leaderboard`,
      {
        key: `leaderboard-${huntId}`,
      },
    );
    return response;
  }

  async function resetAll(shortCode: string) {
    const response = await useFetch<{ success: boolean }>(`/api/hunts/${shortCode}/players`, {
      method: "DELETE",
    });
    return response;
  }

  async function chooseWinner(huntId: number) {
    const response = await useFetch<Pick<Player, "id" | "name" | "score">>(
      `/api/hunts/by-id/${huntId}/choose-winner`,
      {
        method: "POST",
      },
    );
    return response;
  }

  return {
    create,
    getLeaderboard,
    resetAll,
    chooseWinner,
  };
}
