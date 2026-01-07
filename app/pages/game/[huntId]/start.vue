<script setup lang="ts">
import type { Challenge } from "~server/db/schema";

const { huntId } = useRoute().params;
const huntIdNum = Number(huntId);

// Fetch hunt to get the integer ID
const { data: hunt, error: huntError } = await useHuntsApi().getById(huntIdNum);

const playerName = ref("");
const isSubmitting = ref(false);
const errorMessage = ref("");
const isRegistered = ref(false);
const playerInfo = ref<{ huntId: number; playerId: number; playerName: string } | null>(null);
const firstChallenge = ref<Challenge | null>(null);
const isLoadingFirstChallenge = ref(false);

const playersApi = usePlayersApi();
const challengesApi = useChallengesApi();

async function loadFirstChallenge() {
  if (!hunt.value)
    return;

  isLoadingFirstChallenge.value = true;
  const { data: challengesData } = await challengesApi.list(hunt.value.shortCode);

  if (challengesData.value) {
    // Find the first challenge (order=0, not bonus)
    const first = challengesData.value.find(
      c => (c.order === 0 || c.order === null) && !c.isBonus,
    );
    firstChallenge.value = first || null;
  }

  isLoadingFirstChallenge.value = false;
}

// Check if player is already registered for this hunt
function checkExistingRegistration() {
  if (!hunt.value)
    return;

  // Check for existing player cookie for this hunt
  const cookieKey = `Trailhunt:${hunt.value.id}`;
  const playerCookie = useCookie<string | null>(cookieKey, {
    maxAge: 60 * 60 * 24 * 365,
  });

  if (playerCookie.value) {
    try {
      // Handle both string and object cases
      let parsed;
      if (typeof playerCookie.value === "string") {
        parsed = JSON.parse(playerCookie.value);
      }
      else if (typeof playerCookie.value === "object" && playerCookie.value !== null) {
        parsed = playerCookie.value;
      }
      else {
        isRegistered.value = false;
        return;
      }

      // Validate parsed data has required fields
      if (parsed && typeof parsed === "object" && "huntId" in parsed && "playerId" in parsed && "playerName" in parsed) {
        playerInfo.value = parsed;
        isRegistered.value = true;
      }
      else {
        isRegistered.value = false;
      }
    }
    catch (e) {
      console.error("Error parsing player cookie:", e);
      // Invalid cookie, ignore
      isRegistered.value = false;
    }
  }
  else {
    isRegistered.value = false;
  }
}

// Watch for hunt data to check registration
watch(() => hunt.value, (newHunt) => {
  if (newHunt) {
    checkExistingRegistration();
    // If already registered, load first challenge
    if (isRegistered.value) {
      loadFirstChallenge();
    }
  }
}, { immediate: true });

async function handleSubmit() {
  if (!playerName.value.trim()) {
    errorMessage.value = "Please enter your name";
    return;
  }

  if (!hunt.value) {
    errorMessage.value = "Hunt not found";
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = "";

  const { data, error } = await playersApi.create(hunt.value.shortCode, playerName.value.trim());

  if (error.value) {
    errorMessage.value = error.value.message || "Failed to create player";
    isSubmitting.value = false;
    return;
  }

  if (data.value) {
    // Store Trailhunt:huntId cookie (huntId is the integer ID from DB)
    const cookieKey = `Trailhunt:${hunt.value.id}`;
    const playerCookie = useCookie<string | null>(cookieKey, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
    const playerData = {
      huntId: hunt.value.id,
      playerId: data.value.id,
      playerName: data.value.name,
    };
    playerCookie.value = JSON.stringify(playerData);

    playerInfo.value = playerData;
    isRegistered.value = true;
    playerName.value = "";

    // Load first challenge after registration
    await loadFirstChallenge();
  }

  isSubmitting.value = false;
}
</script>

<template>
  <div class="container mx-auto p-4 max-w-4xl">
    <Card v-if="huntError">
      <CardHeader>
        <CardTitle>Error</CardTitle>
        <CardDescription>
          {{ huntError.message }}
        </CardDescription>
      </CardHeader>
    </Card>
    <Card v-else-if="hunt">
      <CardHeader>
        <CardTitle v-if="!isRegistered">
          Start Your Adventure
        </CardTitle>
        <CardTitle v-else>
          Welcome, {{ playerInfo?.playerName }}!
        </CardTitle>
        <CardDescription v-if="!isRegistered">
          Enter your name to join the hunt
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form v-if="!isRegistered" class="space-y-4" @submit.prevent="handleSubmit">
          <div class="space-y-2">
            <Label for="player-name">Your Name</Label>
            <Input id="player-name" v-model="playerName" placeholder="Enter your name" class="w-full"
              :disabled="isSubmitting" required />
          </div>
          <Button type="submit" class="w-full" :disabled="isSubmitting || !playerName.trim()">
            <span v-if="isSubmitting">Creating...</span>
            <span v-else>Start</span>
          </Button>
          <div v-if="hunt?.guidelines" class="rounded-lg bg-muted p-4 space-y-2">
            <h3 class="text-lg font-semibold">
              Guidelines
            </h3>
            <div class="prose prose-sm max-w-none">
              <p class="whitespace-pre-wrap text-muted-foreground">
                {{ hunt.guidelines }}
              </p>
            </div>
          </div>
          <div v-if="errorMessage" class="text-sm text-destructive">
            {{ errorMessage }}
          </div>
        </form>
        <div v-else class="space-y-4">
          <div v-if="isLoadingFirstChallenge" class="flex items-center justify-center py-4">
            <Spinner />
          </div>
          <div v-else-if="firstChallenge?.content" class="rounded-lg bg-primary/10 p-4 space-y-2">
            <h3 class="text-lg font-semibold text-primary">
              Your First Clue
            </h3>
            <div class="prose prose-sm max-w-none">
              <p class="whitespace-pre-wrap">
                {{ firstChallenge.content }}
              </p>
            </div>
          </div>
          <p v-else class="text-muted-foreground">
            Scan the first QR code to get started!
          </p>
        </div>
      </CardContent>
    </Card>
    <Leaderboard v-if="hunt" :hunt-id="hunt.id" class="mt-4" />
    <Card v-else>
      <CardContent>
        <Spinner />
      </CardContent>
    </Card>
  </div>
</template>
