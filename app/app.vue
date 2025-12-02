<script setup lang="ts">
import "vue-sonner/style.css";

const colorMode = useColorMode();
const color = computed(() => colorMode.value === "dark" ? "#09090b" : "#ffffff");

useHead({
  title: "Trail Hunt",
  titleTemplate: "%s | Blue Sonar",
  meta: [
    { charset: "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    { key: "theme-color", name: "theme-color", content: color },
  ],
  link: [
    { rel: "icon", href: "/favicon.ico" },
  ],
  htmlAttrs: {
    lang: "en",
  },

});
</script>

<template>
  <div class="min-h-screen bg-background">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
