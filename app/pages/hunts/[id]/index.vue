<script setup lang="ts">
import type { Challenge } from "~server/db/schema";

const { id } = useRoute().params;
const shortCode = id as string;

const { data: hunt, refresh: refreshHunt, error: huntError, pending: huntLoading } = await useHuntsApi().getByShortCode(shortCode);
const challengesApi = useChallengesApi();
const { data: challenges, refresh: refreshChallenges, error: challengesError, pending: challengesLoading } = await challengesApi.list(shortCode);

const copyShortCode = async () => {
  if (hunt.value?.shortCode && typeof window !== 'undefined') {
    await window.navigator.clipboard.writeText(hunt.value.shortCode);
  }
};

// Dialog states
const createDialogOpen = ref(false);
const editDialogOpen = ref(false);
const editingChallenge = ref<Challenge | null>(null);

// Form states
const challengeName = ref('');
const challengeContent = ref('');

const resetForm = () => {
  challengeName.value = '';
  challengeContent.value = '';
  editingChallenge.value = null;
};

const openCreateDialog = () => {
  resetForm();
  createDialogOpen.value = true;
};

const openEditDialog = (challenge: Challenge) => {
  editingChallenge.value = challenge;
  challengeName.value = challenge.name;
  challengeContent.value = challenge.content ?? '';
  editDialogOpen.value = true;
};

const handleCreate = async () => {
  if (!challengeName.value.trim()) return;

  const contentValue = challengeContent.value.trim();
  const { error } = await challengesApi.create(shortCode, {
    name: challengeName.value.trim(),
    content: contentValue || null,
  });

  if (!error.value) {
    createDialogOpen.value = false;
    resetForm();
    await refreshChallenges();
  }
};

const handleUpdate = async () => {
  if (!editingChallenge.value || !challengeName.value.trim()) return;

  const { error } = await challengesApi.update(shortCode, editingChallenge.value.id, {
    name: challengeName.value.trim(),
    content: challengeContent.value.trim() || undefined,
  });

  if (!error.value) {
    editDialogOpen.value = false;
    resetForm();
    await refreshChallenges();
  }
};

const handleDelete = async (challengeId: number) => {
  const { error } = await challengesApi.remove(shortCode, challengeId);
  if (!error.value) {
    await refreshChallenges();
  }
};

const handleMoveUp = async (index: number) => {
  if (!challenges.value || index === 0) return;

  const current = challenges.value[index];
  const previous = challenges.value[index - 1];
  if (!current || !previous) return;

  const newOrder: Challenge[] = [...challenges.value];
  if (newOrder[index - 1] && newOrder[index]) {
    const temp = newOrder[index - 1]!;
    newOrder[index - 1] = newOrder[index]!;
    newOrder[index] = temp;
  }
  const challengeIds = newOrder.map(c => c.id);

  const { error } = await challengesApi.reorder(shortCode, challengeIds);
  if (!error.value) {
    await refreshChallenges();
  }
};

const handleMoveDown = async (index: number) => {
  if (!challenges.value || index === challenges.value.length - 1) return;

  const current = challenges.value[index];
  const next = challenges.value[index + 1];
  if (!current || !next) return;

  const newOrder: Challenge[] = [...challenges.value];
  if (newOrder[index] && newOrder[index + 1]) {
    const temp = newOrder[index]!;
    newOrder[index] = newOrder[index + 1]!;
    newOrder[index + 1] = temp;
  }
  const challengeIds = newOrder.map(c => c.id);

  const { error } = await challengesApi.reorder(shortCode, challengeIds);
  if (!error.value) {
    await refreshChallenges();
  }
};
</script>

<template>
  <div class="container mx-auto p-4 max-w-4xl">
    <section v-if="huntLoading">
      <Spinner />
    </section>
    <section v-else-if="huntError">
      <p>{{ huntError.message }}</p>
      <Button @click="refreshHunt">Retry</Button>
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
            <NuxtLink :to="`/hunts/${shortCode}/prints`">Print QR Codes</NuxtLink>
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
                <Button @click="openCreateDialog">Create Challenge</Button>
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
                </div>
                <DialogFooter>
                  <Button variant="outline" @click="createDialogOpen = false">Cancel</Button>
                  <Button @click="handleCreate" :disabled="!challengeName.trim()">Create</Button>
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
            <p class="text-destructive">{{ challengesError.message }}</p>
            <Button @click="refreshChallenges" class="mt-4">Retry</Button>
          </div>
          <div v-else-if="!challenges || challenges.length === 0" class="py-8 text-center text-muted-foreground">
            <p>No challenges yet. Create your first challenge to get started!</p>
          </div>
          <ItemGroup v-else class="space-y-2">
            <Item v-for="(challenge, index) in challenges" :key="challenge.id" variant="outline" class="group">
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
                  <Button size="sm" variant="ghost" :disabled="index === 0" @click="handleMoveUp(index)"
                    class="h-6 w-6 p-0">
                    <Icon name="mdi:chevron-up" size="16" />
                  </Button>
                  <Button size="sm" variant="ghost" :disabled="index === challenges.length - 1"
                    @click="handleMoveDown(index)" class="h-6 w-6 p-0">
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
                    </div>
                    <DialogFooter>
                      <Button variant="outline" @click="editDialogOpen = false">Cancel</Button>
                      <Button @click="handleUpdate" :disabled="!challengeName.trim()">Save</Button>
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
