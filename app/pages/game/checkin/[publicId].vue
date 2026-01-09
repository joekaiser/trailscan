<script setup lang="ts">
import type { Challenge } from "~server/db/schema";

const { publicId } = useRoute().params;
const router = useRouter();

const challenge = ref<Challenge | null>(null);
const isLoading = ref(true);
const isCheckingIn = ref(true);
const errorMessage = ref<string | null>(null);
const checkinResult = ref<{
  success: boolean;
  alreadyCheckedIn: boolean;
  pointsAwarded: number;
  totalPoints: number;
  position: number | null;
} | null>(null);

// Load challenge by publicId
const { data: challengeData, error: challengeError } = await useFetch<Challenge>(
  `/api/challenges/by-public-id/${publicId}`,
  {
    key: `challenge-${publicId}`,
  },
);

if (challengeError.value) {
  errorMessage.value = challengeError.value.message || "Failed to load challenge";
  isLoading.value = false;
  isCheckingIn.value = false;
}
else if (challengeData.value) {
  challenge.value = challengeData.value;

  // Get huntId from challenge to check cookie
  const huntId = challenge.value.huntId;
  if (!huntId) {
    errorMessage.value = "Challenge is not associated with a hunt";
    isLoading.value = false;
    isCheckingIn.value = false;
  }
  else {
    // Check if player is registered
    const cookieKey = `th:${huntId}`;
    const playerCookie = useCookie<string | null>(cookieKey, {
      maxAge: 60 * 60 * 24 * 365,
    });

    if (!playerCookie.value) {
      // Not registered, redirect to start page
      await navigateTo(`/game/${huntId}/start`);
    }
    else {
      // Parse player data
      let playerData: { huntId: number; playerId: number; playerName: string } | null = null;
      try {
        playerData = typeof playerCookie.value === "string"
          ? JSON.parse(playerCookie.value)
          : playerCookie.value;
      }
      catch (e) {
        errorMessage.value = "Invalid player cookie";
        isLoading.value = false;
        isCheckingIn.value = false;
      }

      if (playerData && playerData.playerId) {
        // Automatically check in
        isLoading.value = false;
        const { data: checkinData, error: checkinError } = await useFetch<{
          success: boolean;
          alreadyCheckedIn: boolean;
          pointsAwarded: number;
          totalPoints: number;
          position: number | null;
        }>(`/api/challenges/by-public-id/${publicId}/checkin`, {
          method: "POST",
        });

        isCheckingIn.value = false;

        if (checkinError.value) {
          // Check if this is an out-of-order scan error
          const isOutOfOrderError = checkinError.value.statusCode === 400
            && (checkinError.value.message?.includes("incorrect code")
              || checkinError.value.message?.includes("in order"));

          if (isOutOfOrderError) {
            errorMessage.value = "Oops! You scanned this code out of order. Please scan the challenges in sequence, starting with the first one.";
          }
          else {
            errorMessage.value = checkinError.value.message || "Failed to check in";
          }
        }
        else if (checkinData.value) {
          checkinResult.value = checkinData.value;
        }
      }
      else {
        await navigateTo(`/game/${huntId}/start`);
      }
    }
  }
}
else {
  isLoading.value = false;
  isCheckingIn.value = false;
}
</script>

<template>
  <div class="container mx-auto p-4 max-w-4xl">
    <Card v-if="isLoading">
      <CardContent class="pt-6">
        <div class="flex flex-col items-center justify-center space-y-4">
          <Spinner />
          <p class="text-muted-foreground">
            Loading challenge...
          </p>
        </div>
      </CardContent>
    </Card>

    <Card v-else-if="errorMessage">
      <CardHeader>
        <CardTitle>{{ errorMessage.includes("out of order") ? "Not Quite Right!" : "Error" }}</CardTitle>
        <CardDescription>{{ errorMessage }}</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <p v-if="errorMessage.includes('out of order')" class="text-muted-foreground">
            Don't worry! Just make sure you're scanning the challenges in the correct sequence.
            Check your previous clues to find the next challenge in order.
          </p>
          <Button v-if="challenge?.huntId" @click="router.push(`/game/${challenge.huntId}/start`)">
            Go to Start Page
          </Button>
        </div>
      </CardContent>
    </Card>

    <Card v-else-if="challenge">
      <CardHeader>
        <CardTitle>{{ challenge.name }}</CardTitle>
        <CardDescription v-if="isCheckingIn">
          Checking in...
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div v-if="isCheckingIn" class="flex flex-col items-center justify-center space-y-4 py-8">
          <Spinner />
          <p class="text-muted-foreground">
            Processing your check-in...
          </p>
        </div>

        <div v-else-if="checkinResult">
          <div v-if="checkinResult.alreadyCheckedIn" class="space-y-4">
            <p class="text-muted-foreground">
              You have already checked into this challenge.
            </p>
            <div class="rounded-lg bg-muted p-4">
              <p class="text-sm font-medium">
                Total Points
              </p>
              <p class="text-2xl font-bold">
                {{ checkinResult.totalPoints }}
              </p>
            </div>
          </div>

          <div v-else class="space-y-4">
            <div class="rounded-lg bg-primary/10 p-4">
              <p class="text-sm font-medium text-primary">
                Check-in Successful!
              </p>
              <p class="text-2xl font-bold text-primary">
                +{{ checkinResult.pointsAwarded }} points
              </p>
              <p v-if="checkinResult.position" class="text-sm text-muted-foreground mt-2">
                You were the {{ checkinResult.position }}{{
  checkinResult.position === 1 ? 'st'
    : checkinResult.position === 2 ? 'nd'
      : checkinResult.position === 3 ? 'rd' : 'th'
                }} person to check in!
              </p>
            </div>

            <div class="rounded-lg bg-muted p-4">
              <p class="text-sm font-medium">
                Total Points
              </p>
              <p class="text-2xl font-bold">
                {{ checkinResult.totalPoints }}
              </p>
            </div>
          </div>
        </div>

        <div v-if="challenge.content" class="mt-6 pt-6 border-t">
          <h3 class="text-lg font-semibold mb-2">
            {{ challenge.name }}
          </h3>
          <div class="prose prose-sm max-w-none">
            <p class="whitespace-pre-wrap">
              {{ challenge.content }}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
    <Leaderboard v-if="challenge?.huntId" :hunt-id="challenge.huntId" class="mt-4" />
  </div>
</template>
