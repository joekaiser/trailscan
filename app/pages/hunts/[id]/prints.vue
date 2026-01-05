<script setup lang="ts">
import QRCode from "qrcode";

import type { Challenge } from "~server/db/schema";

const { id } = useRoute().params;
const shortCode = id as string;

const { data: hunt, error: huntError, pending: huntLoading } = await useHuntsApi().getByShortCode(shortCode);
const challengesApi = useChallengesApi();
const { data: challenges, error: challengesError, pending: challengesLoading } = await challengesApi.list(shortCode);

// Generate QR code data URLs for each challenge
const qrCodeDataUrls = ref<Record<number, string>>({});
// QR code for the start page
const startPageQrCode = ref<string>("");

async function generateQRCode(challenge: Challenge) {
  if (qrCodeDataUrls.value[challenge.id]) {
    return qrCodeDataUrls.value[challenge.id];
  }

  try {
    // Get the base URL - QR code generation happens client-side only
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const challengeUrl = `${baseUrl}/game/checkin/${challenge.publicId}`;

    // Generate QR code as data URL
    const dataUrl = await QRCode.toDataURL(challengeUrl, {
      width: 300,
      margin: 2,
    });

    qrCodeDataUrls.value[challenge.id] = dataUrl;
    return dataUrl;
  }
  catch (error) {
    console.error("Error generating QR code:", error);
    return "";
  }
}

async function generateStartPageQRCode() {
  if (startPageQrCode.value || !hunt.value) {
    return startPageQrCode.value;
  }

  try {
    // Get the base URL - QR code generation happens client-side only
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const startUrl = `${baseUrl}/game/${hunt.value.id}/start`;

    // Generate QR code as data URL
    const dataUrl = await QRCode.toDataURL(startUrl, {
      width: 300,
      margin: 2,
    });

    startPageQrCode.value = dataUrl;
    return dataUrl;
  }
  catch (error) {
    console.error("Error generating start page QR code:", error);
    return "";
  }
}

// Split challenges into regular and bonus
const regularChallenges = computed(() => {
  return challenges.value?.filter(c => !c.isBonus) ?? [];
});

const bonusChallenges = computed(() => {
  return challenges.value?.filter(c => c.isBonus) ?? [];
});

// Generate QR codes for all challenges when they're loaded (client-side only)
watch(challenges, async (newChallenges) => {
  if (newChallenges && newChallenges.length > 0 && import.meta.client) {
    await Promise.all(newChallenges.map(challenge => generateQRCode(challenge)));
  }
}, { immediate: true });

// Generate start page QR code when hunt is loaded
watch(hunt, async (newHunt) => {
  if (newHunt && import.meta.client) {
    await generateStartPageQRCode();
  }
}, { immediate: true });

// Also generate on mount if client-side
onMounted(async () => {
  if (challenges.value && challenges.value.length > 0) {
    await Promise.all(challenges.value.map(challenge => generateQRCode(challenge)));
  }
  if (hunt.value) {
    await generateStartPageQRCode();
  }
});
</script>

a
<template>
  <div class="container mx-auto p-4 max-w-6xl">
    <section v-if="huntLoading || challengesLoading">
      <div class="py-8">
        <Spinner />
      </div>
    </section>
    <section v-else-if="huntError || challengesError">
      <div class="py-8 text-center">
        <p class="text-destructive">
          {{ huntError?.message || challengesError?.message }}
        </p>
      </div>
    </section>
    <section v-else-if="hunt" class="space-y-6">
      <!-- Header -->
      <Card>
        <CardHeader>
          <CardTitle>QR Codes for {{ hunt.name }}</CardTitle>
          <CardDescription>
            Print these QR codes for each challenge in your hunt
          </CardDescription>
        </CardHeader>
      </Card>

      <!-- Start Page QR Code -->
      <Card>
        <CardHeader>
          <CardTitle>Start Page QR Code</CardTitle>
          <CardDescription>
            Players scan this QR code to join the game
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="flex flex-col items-center space-y-3 p-4">
            <div v-if="startPageQrCode" class="flex-shrink-0 border rounded-lg p-4">
              <img :src="startPageQrCode" alt="QR code for start page" class="w-full max-w-[300px] h-auto">
            </div>
            <div v-else class="flex items-center justify-center w-[300px] h-[300px] bg-muted">
              <Spinner />
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Regular Challenges QR Codes -->
      <div v-if="!challenges || challenges.length === 0" class="py-8 text-center text-muted-foreground">
        <p>No challenges yet. Create challenges first to generate QR codes.</p>
      </div>
      <div v-else>
        <!-- Regular Challenges -->
        <div v-if="regularChallenges.length > 0" class="mb-8">
          <h2 class="text-xl font-semibold mb-4">
            Regular Challenges
          </h2>
          <div class="grid grid-cols-3 gap-6">
            <div v-for="challenge in regularChallenges" :key="challenge.id"
              class="flex flex-col items-center space-y-3 p-4">
              <p class="text-center text-sm">
                Step {{ (challenge.order ?? 0) + 1 }}: {{ challenge.name }}
              </p>
              <div v-if="qrCodeDataUrls[challenge.id]" class="flex-shrink-0 border rounded-lg p-4">
                <img :src="qrCodeDataUrls[challenge.id]" :alt="`QR code for ${challenge.name}`"
                  class="w-full max-w-[300px] h-auto">
              </div>
              <div v-else class="flex items-center justify-center w-[300px] h-[300px] bg-muted">
                <Spinner />
              </div>
            </div>
          </div>
        </div>

        <!-- Bonus Codes -->
        <div v-if="bonusChallenges.length > 0" class="mt-8">
          <h2 class="text-xl font-semibold mb-4">
            Bonus Codes
          </h2>
          <div class="grid grid-cols-3 gap-6">
            <div v-for="challenge in bonusChallenges" :key="challenge.id"
              class="flex flex-col items-center space-y-3 p-4">
              <div class="flex items-center gap-2">
                <Icon name="mdi:star" size="20" class="text-yellow-500" />
                <p class="text-center text-sm font-semibold">
                  BONUS: {{ challenge.name }}
                </p>
              </div>
              <div v-if="qrCodeDataUrls[challenge.id]" class="flex-shrink-0 border-2 border-yellow-500 rounded-lg p-4">
                <img :src="qrCodeDataUrls[challenge.id]" :alt="`QR code for ${challenge.name}`"
                  class="w-full max-w-[300px] h-auto">
              </div>
              <div v-else class="flex items-center justify-center w-[300px] h-[300px] bg-muted">
                <Spinner />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
