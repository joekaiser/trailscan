import type { Challenge, Hunt } from "~server/db/schema";

const KEYS = {
  DETAIL: (shortCode: string, challengeId: number) => `challenges-${shortCode}-${challengeId}`,
  LIST: (shortCode: string) => `challenges-${shortCode}-list`,
};

export default function useChallengesApi() {
  async function getById(shortCode: string, challengeId: number) {
    return useFetch<Challenge>(`/api/hunts/${shortCode}/challenges/${challengeId}`, {
      key: KEYS.DETAIL(shortCode, challengeId),
    });
  }

  async function list(shortCode: string) {
    return useFetch<Challenge[]>(`/api/hunts/${shortCode}/challenges`, {
      key: KEYS.LIST(shortCode),
    });
  }

  async function create(shortCode: string, data: { name: string; content?: string | null; previousChallengeId?: number | null; isBonus?: boolean }) {
    const response = await useFetch<Challenge>(`/api/hunts/${shortCode}/challenges`, {
      method: "POST",
      body: data,
    });
    await refreshList(shortCode);
    return response;
  }

  async function update(shortCode: string, challengeId: number, data: { name?: string; content?: string; isBonus?: boolean }) {
    const response = await useFetch<Challenge>(`/api/hunts/${shortCode}/challenges/${challengeId}`, {
      method: "PATCH",
      body: data,
    });
    await refreshList(shortCode);
    return response;
  }

  async function reorder(shortCode: string, challengeIds: number[]) {
    const response = await useFetch<Challenge[]>(`/api/hunts/${shortCode}/challenges/reorder`, {
      method: "PATCH",
      body: { challengeIds },
    });
    await refreshList(shortCode);
    return response;
  }

  async function remove(shortCode: string, challengeId: number) {
    const response = await useFetch<Challenge>(`/api/hunts/${shortCode}/challenges/${challengeId}`, {
      method: "DELETE",
    });
    await refreshList(shortCode);
    return response;
  }

  async function refreshList(shortCode: string) {
    return await refreshNuxtData(KEYS.LIST(shortCode));
  }

  async function refreshDetail(shortCode: string, challengeId: number) {
    return await refreshNuxtData(KEYS.DETAIL(shortCode, challengeId));
  }

  return {
    getById,
    list,
    create,
    update,
    reorder,
    remove,
  };
}
