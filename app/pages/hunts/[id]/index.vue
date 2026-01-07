<script setup lang="ts">
import type { Challenge } from "~server/db/schema";

const { id } = useRoute().params;
const shortCode = id as string;

const huntsApi = useHuntsApi();
const { data: hunt, refresh: refreshHunt, error: huntError, pending: huntLoading } = await huntsApi.getByShortCode(shortCode);
const challengesApi = useChallengesApi();
const { data: challenges, refresh: refreshChallenges, error: challengesError, pending: challengesLoading } = await challengesApi.list(shortCode);

async function copyShortCode() {
  if (hunt.value?.shortCode && typeof window !== "undefined") {
    await window.navigator.clipboard.writeText(hunt.value.shortCode);
  }
}

// Dialog states
const createDialogOpen = ref(false);
const editDialogOpen = ref(false);
const editingChallenge = ref<Challenge | null>(null);

// Form states
const challengeName = ref("");
const challengeContent = ref("");
const isBonus = ref(false);

function resetForm() {
  challengeName.value = "";
  challengeContent.value = "";
  isBonus.value = false;
  editingChallenge.value = null;
}

function openCreateDialog() {
  resetForm();
  createDialogOpen.value = true;
}

function openCreateBonusDialog() {
  resetForm();
  isBonus.value = true;
  createDialogOpen.value = true;
}

function openEditDialog(challenge: Challenge) {
  editingChallenge.value = challenge;
  challengeName.value = challenge.name;
  challengeContent.value = challenge.content ?? "";
  isBonus.value = challenge.isBonus ?? false;
  editDialogOpen.value = true;
}

async function handleCreate() {
  if (!challengeName.value.trim())
    return;

  const contentValue = challengeContent.value.trim();
  const { error } = await challengesApi.create(shortCode, {
    name: challengeName.value.trim(),
    content: contentValue || null,
    isBonus: isBonus.value,
  });

  if (!error.value) {
    createDialogOpen.value = false;
    resetForm();
    await refreshChallenges();
  }
}

async function handleUpdate() {
  if (!editingChallenge.value || !challengeName.value.trim())
    return;

  const { error } = await challengesApi.update(shortCode, editingChallenge.value.id, {
    name: challengeName.value.trim(),
    content: challengeContent.value.trim() || undefined,
    isBonus: isBonus.value,
  });

  if (!error.value) {
    editDialogOpen.value = false;
    resetForm();
    await refreshChallenges();
  }
}

async function handleDelete(challengeId: number) {
  const { error } = await challengesApi.remove(shortCode, challengeId);
  if (!error.value) {
    await refreshChallenges();
  }
}

async function handleMoveUp(index: number) {
  const regular = regularChallenges.value;
  if (!regular || index === 0)
    return;

  const current = regular[index];
  const previous = regular[index - 1];
  if (!current || !previous)
    return;

  // Get all challenges and reorder only the regular ones
  const allChallenges = [...(challenges.value ?? [])];
  const currentIndex = allChallenges.findIndex(c => c.id === current.id);
  const previousIndex = allChallenges.findIndex(c => c.id === previous.id);

  if (currentIndex !== -1 && previousIndex !== -1) {
    const temp = allChallenges[previousIndex]!;
    allChallenges[previousIndex] = allChallenges[currentIndex]!;
    allChallenges[currentIndex] = temp;
  }

  // Only reorder regular challenges (non-bonus)
  const regularIds = allChallenges.filter(c => !c.isBonus).map(c => c.id);

  const { error } = await challengesApi.reorder(shortCode, regularIds);
  if (!error.value) {
    await refreshChallenges();
  }
}

async function handleMoveDown(index: number) {
  const regular = regularChallenges.value;
  if (!regular || index === regular.length - 1)
    return;

  const current = regular[index];
  const next = regular[index + 1];
  if (!current || !next)
    return;

  // Get all challenges and reorder only the regular ones
  const allChallenges = [...(challenges.value ?? [])];
  const currentIndex = allChallenges.findIndex(c => c.id === current.id);
  const nextIndex = allChallenges.findIndex(c => c.id === next.id);

  if (currentIndex !== -1 && nextIndex !== -1) {
    const temp = allChallenges[currentIndex]!;
    allChallenges[currentIndex] = allChallenges[nextIndex]!;
    allChallenges[nextIndex] = temp;
  }

  // Only reorder regular challenges (non-bonus)
  const regularIds = allChallenges.filter(c => !c.isBonus).map(c => c.id);

  const { error } = await challengesApi.reorder(shortCode, regularIds);
  if (!error.value) {
    await refreshChallenges();
  }
}

// Split challenges into regular and bonus
const regularChallenges = computed(() => {
  return challenges.value?.filter(c => !c.isBonus) ?? [];
});

const bonusChallenges = computed(() => {
  return challenges.value?.filter(c => c.isBonus) ?? [];
});

// Guidelines form state
const guidelinesText = ref("");
const isSavingGuidelines = ref(false);

watch(() => hunt.value, (newHunt) => {
  if (newHunt) {
    guidelinesText.value = newHunt.guidelines ?? "";
  }
}, { immediate: true });

async function handleSaveGuidelines() {
  if (!hunt.value)
    return;

  isSavingGuidelines.value = true;
  const { error } = await huntsApi.update(shortCode, {
    guidelines: guidelinesText.value.trim() || null,
  });

  if (!error.value) {
    await refreshHunt();
  }

  isSavingGuidelines.value = false;
}
</script>

<template>
  <div class="container mx-auto p-4 max-w-4xl">
    <section v-if="huntLoading">
      <Spinner />
    </section>
    <section v-else-if="huntError">
      <p>{{ huntError.message }}</p>
      <Button @click="refreshHunt">
        Retry
      </Button>
    </section>
    <section v-else-if="hunt" class="space-y-6">
      <!-- Hunt Info Section -->
      <Card>
        <CardHeader>
          <CardTitle>{{ hunt.name }}</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <Item variant="outline">
              <ItemMedia>
                <Icon name="mdi:shield-key" size="32" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{{ hunt.shortCode }}</ItemTitle>
                <ItemDescription>
                  Keep this code secret! This is how you will access your hunt.
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button size="sm" variant="outline" @click="copyShortCode">
                  Copy
                </Button>
              </ItemActions>
            </Item>
            <NuxtLink :to="`/hunts/${shortCode}/prints`">
              Print QR Codes
            </NuxtLink>
          </div>
          <div class="space-y-2 pt-4 border-t">
            <Label for="guidelines">Guidelines</Label>
            <Textarea id="guidelines" v-model="guidelinesText"
              placeholder="Enter guidelines for players (displayed on registration page)" rows="6" />
            <div class="flex justify-end">
              <Button :disabled="isSavingGuidelines" @click="handleSaveGuidelines">
                <span v-if="isSavingGuidelines">Saving...</span>
                <span v-else>Save Guidelines</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Challenges Section -->
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle>Challenges</CardTitle>
              <CardDescription>
                Manage the steps and challenges for this hunt
              </CardDescription>
            </div>
            <Dialog v-model:open="createDialogOpen">
              <DialogTrigger as-child>
                <Button @click="openCreateDialog">
                  Create Challenge
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Challenge</DialogTitle>
                  <DialogDescription>
                    Add a new challenge to your hunt
                  </DialogDescription>
                </DialogHeader>
                <div class="space-y-4 py-4">
                  <div class="space-y-2">
                    <Label for="create-name">Name</Label>
                    <Input id="create-name" v-model="challengeName" placeholder="Challenge name" required />
                  </div>
                  <div class="space-y-2">
                    <Label for="create-content">Clue to find next location</Label>
                    <Textarea id="create-content" v-model="challengeContent"
                      placeholder="Challenge description or instructions" rows="4" />
                  </div>
                  <div class="flex items-center space-x-2">
                    <input id="create-is-bonus" v-model="isBonus" type="checkbox" class="rounded border-gray-300">
                    <Label for="create-is-bonus" class="!mt-0 cursor-pointer">
                      This is a bonus code
                    </Label>
                  </div>
                  <p v-if="isBonus" class="text-sm text-muted-foreground">
                    Bonus codes can be scanned at any time (only once per player) for extra points.
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="outline" @click="createDialogOpen = false">
                    Cancel
                  </Button>
                  <Button :disabled="!challengeName.trim()" @click="handleCreate">
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div v-if="challengesLoading" class="py-8">
            <Spinner />
          </div>
          <div v-else-if="challengesError" class="py-8 text-center">
            <p class="text-destructive">
              {{ challengesError.message }}
            </p>
            <Button class="mt-4" @click="refreshChallenges">
              Retry
            </Button>
          </div>
          <div v-else-if="regularChallenges.length === 0" class="py-8 text-center text-muted-foreground">
            <p>No challenges yet. Create your first challenge to get started!</p>
          </div>
          <ItemGroup v-else class="space-y-2">
            <Item v-for="(challenge, index) in regularChallenges" :key="challenge.id" variant="outline" class="group">
              <ItemMedia>
                <div
                  class="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground font-semibold">
                  {{ index + 1 }}
                </div>
              </ItemMedia>
              <ItemContent class="flex-1">
                <ItemTitle>{{ challenge.name }}</ItemTitle>
                <ItemDescription v-if="challenge.content">
                  {{ challenge.content }}
                </ItemDescription>
              </ItemContent>
              <ItemActions class="flex items-center gap-2">
                <div class="flex flex-col gap-1">
                  <Button size="sm" variant="ghost" :disabled="index === 0" class="h-6 w-6 p-0"
                    @click="handleMoveUp(index)">
                    <Icon name="mdi:chevron-up" size="16" />
                  </Button>
                  <Button size="sm" variant="ghost" :disabled="index === regularChallenges.length - 1"
                    class="h-6 w-6 p-0" @click="handleMoveDown(index)">
                    <Icon name="mdi:chevron-down" size="16" />
                  </Button>
                </div>
                <Dialog v-model:open="editDialogOpen">
                  <DialogTrigger as-child>
                    <Button size="sm" variant="outline" @click="openEditDialog(challenge)">
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Challenge</DialogTitle>
                      <DialogDescription>
                        Update challenge details
                      </DialogDescription>
                    </DialogHeader>
                    <div class="space-y-4 py-4">
                      <div class="space-y-2">
                        <Label for="edit-name">Name</Label>
                        <Input id="edit-name" v-model="challengeName" placeholder="Challenge name" required />
                      </div>
                      <div class="space-y-2">
                        <Label for="edit-content">Clue to find next location</Label>
                        <Textarea id="edit-content" v-model="challengeContent"
                          placeholder="Challenge description or instructions" rows="4" />
                      </div>
                      <div class="flex items-center space-x-2">
                        <input id="edit-is-bonus" v-model="isBonus" type="checkbox" class="rounded border-gray-300">
                        <Label for="edit-is-bonus" class="!mt-0 cursor-pointer">
                          This is a bonus code
                        </Label>
                      </div>
                      <p v-if="isBonus" class="text-sm text-muted-foreground">
                        Bonus codes can be scanned at any time (only once per player) for extra points.
                      </p>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" @click="editDialogOpen = false">
                        Cancel
                      </Button>
                      <Button :disabled="!challengeName.trim()" @click="handleUpdate">
                        Save
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <ConfirmButton size="sm" variant="destructive" @confirm="handleDelete(challenge.id)">
                  Delete
                </ConfirmButton>
              </ItemActions>
            </Item>
          </ItemGroup>
        </CardContent>
      </Card>

      <!-- Bonus Codes Section -->
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle>Bonus Codes</CardTitle>
              <CardDescription>
                Optional codes that can be scanned at any time for extra points
              </CardDescription>
            </div>
            <Dialog v-model:open="createDialogOpen">
              <DialogTrigger as-child>
                <Button @click="openCreateBonusDialog">
                  Create
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a new challenge</DialogTitle>
                  <DialogDescription>
                    Add a new challenge to your hunt
                  </DialogDescription>
                </DialogHeader>
                <div class="space-y-4 py-4">
                  <div class="space-y-2">
                    <Label for="create-bonus-name">Name</Label>
                    <Input id="create-bonus-name" v-model="challengeName" placeholder="Enter a name" required />
                  </div>
                  <div class="space-y-2">
                    <Label for="create-bonus-content">Clue or description</Label>
                    <Textarea id="create-bonus-content" v-model="challengeContent"
                      placeholder="Optional clue or description" rows="4" />
                  </div>
                  <div class="flex items-center space-x-2">
                    <input id="create-bonus-is-bonus" v-model="isBonus" type="checkbox" class="rounded border-gray-300">
                    <Label for="create-bonus-is-bonus" class="!mt-0 cursor-pointer">
                      This is a bonus code
                    </Label>
                  </div>
                  <p v-if="isBonus" class="text-sm text-muted-foreground">
                    Bonus codes can be scanned at any time (only once per player) for extra points.
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="outline" @click="createDialogOpen = false">
                    Cancel
                  </Button>
                  <Button :disabled="!challengeName.trim()" @click="handleCreate">
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div v-if="bonusChallenges.length === 0" class="py-8 text-center text-muted-foreground">
            <p>No bonus codes yet. Create your first bonus code to add optional challenges!</p>
          </div>
          <ItemGroup v-else class="space-y-2">
            <Item v-for="challenge in bonusChallenges" :key="challenge.id" variant="outline" class="group">
              <ItemMedia>
                <Icon name="mdi:star" size="24" class="text-yellow-500" />
              </ItemMedia>
              <ItemContent class="flex-1">
                <ItemTitle>{{ challenge.name }}</ItemTitle>
                <ItemDescription v-if="challenge.content">
                  {{ challenge.content }}
                </ItemDescription>
              </ItemContent>
              <ItemActions class="flex items-center gap-2">
                <Dialog v-model:open="editDialogOpen">
                  <DialogTrigger as-child>
                    <Button size="sm" variant="outline" @click="openEditDialog(challenge)">
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Bonus Code</DialogTitle>
                      <DialogDescription>
                        Update bonus code details
                      </DialogDescription>
                    </DialogHeader>
                    <div class="space-y-4 py-4">
                      <div class="space-y-2">
                        <Label for="edit-bonus-name">Name</Label>
                        <Input id="edit-bonus-name" v-model="challengeName" placeholder="Bonus code name" required />
                      </div>
                      <div class="space-y-2">
                        <Label for="edit-bonus-content">Clue or description</Label>
                        <Textarea id="edit-bonus-content" v-model="challengeContent"
                          placeholder="Optional clue or description" rows="4" />
                      </div>
                      <div class="flex items-center space-x-2">
                        <input id="edit-bonus-is-bonus" v-model="isBonus" type="checkbox"
                          class="rounded border-gray-300">
                        <Label for="edit-bonus-is-bonus" class="!mt-0 cursor-pointer">
                          This is a bonus code
                        </Label>
                      </div>
                      <p v-if="isBonus" class="text-sm text-muted-foreground">
                        Bonus codes can be scanned at any time (only once per player) for extra points.
                      </p>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" @click="editDialogOpen = false">
                        Cancel
                      </Button>
                      <Button :disabled="!challengeName.trim()" @click="handleUpdate">
                        Save
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <ConfirmButton size="sm" variant="destructive" @confirm="handleDelete(challenge.id)">
                  Delete
                </ConfirmButton>
              </ItemActions>
            </Item>
          </ItemGroup>
        </CardContent>
      </Card>
    </section>
  </div>
</template>
