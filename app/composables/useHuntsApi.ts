import type { Hunt } from "~server/db/schema";
const KEYS = {
  DETAIL: (shortCode: string) => `hunts-${shortCode}`,
  DETAIL_BY_ID: (id: number) => `hunts-by-id-${id}`,
};

export default function useHuntsApi() {
  async function getByShortCode(id: string) {
    return useFetch<Hunt>(`/api/hunts/${id}`, {
      key: KEYS.DETAIL(id),
    });
  }

  async function getById(id: number) {
    return useFetch<Hunt>(`/api/hunts/by-id/${id}`, {
      key: KEYS.DETAIL_BY_ID(id),
    });
  }

  async function create(name: string) {
    const response = await useFetch<Hunt>("/api/hunts", {
      method: "POST",
      body: { name },
    });
    // await refreshList();
    return response;
  }


  // async function refreshList() {
  //   return await refreshNuxtData(KEYS.LIST());
  // }

  async function refreshShowDetail(shortCode: string) {
    return await refreshNuxtData(KEYS.DETAIL(shortCode));
  }

  return {
    getByShortCode,
    getById,
    create,
    refreshShowDetail,
  };
}
