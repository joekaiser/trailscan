<script setup>
import { ref } from "vue";

const isOpen = ref(false);
const navigationlinksWhenSignedIn = [
  {
    name: "Dashboard",
    href: "/dashboard",
  },
  {
    name: "Search",
    href: "/search",
  },
  {
    name: "Admin",
    href: "/admin",
  },
];

function toggleMenu() {
  isOpen.value = !isOpen.value;
}
</script>

<template>
  <div class="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
    <div class="flex items-center gap-4">
      Trail Hunt
      <!-- <img src="/public/images/logo.svg" style="max-height: 40px;"> -->
    </div>

    <!-- Desktop Navigation -->
    <div class="ml-auto hidden items-center gap-4 md:flex">
      <SignedIn>
        <LayoutNavbarLink
          v-for="link in navigationlinksWhenSignedIn"
          :key="link.name"
          :to="link.href"
        >
          {{ link.name }}
        </LayoutNavbarLink>
        <Upload />
        <UserButton />
      </SignedIn>
      <SignedOut>
        <SignInButton mode="modal">
          <Button
            variant="outline"
            size="lg"
          >
            Login
          </Button>
        </SignInButton>
      </SignedOut>
    </div>

    <!-- Mobile Navigation -->
    <div class="ml-auto flex items-center gap-2 md:hidden">
      <SignedOut>
        <SignInButton mode="modal">
          <Button
            variant="outline"
            size="lg"
          >
            Login
          </Button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-md p-2 text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
          aria-expanded="false"
          @click="toggleMenu"
        >
          <span class="sr-only">Open main menu</span>
          <!-- Icon when menu is closed -->
          <Icon
            v-if="!isOpen"
            size="24"
            name="heroicons-solid:menu"
          />
          <!-- Icon when menu is open -->
          <Icon
            v-else
            size="24"
            name="heroicons-solid:x-mark"
          />
        </button>
      </SignedIn>
    </div>

    <!-- Mobile Menu -->
    <div
      v-if="isOpen"
      class="absolute inset-x-0 top-16 z-50 origin-top-right transform transition md:hidden"
    >
      <div
        class="divide-y divide-border  rounded-b-lg bg-background shadow-lg mx-2 "
      >
        <div
          class="
        px-5
        py-6"
        >
          <div class="grid gap-y-4">
            <SignedIn>
              <LayoutNavbarLink
                v-for="link in navigationlinksWhenSignedIn"
                :key="link.name"
                :to="link.href"
                @click="isOpen = false"
              >
                {{ link.name }}
              </LayoutNavbarLink>
              <div class="px-3 py-2">
                <UserButton />
              </div>
            </SignedIn>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
