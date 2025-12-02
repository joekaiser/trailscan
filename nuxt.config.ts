import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  alias: {
    "~server": fileURLToPath(new URL("./server", import.meta.url)),
  },

  css: ["~/assets/css/tailwind.css"],
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },

  components: [
    {
      path: "~/components",
      extensions: [".vue"],
    },
  ],

  modules: [
    "@nuxt/eslint",
    "shadcn-nuxt",
    "@nuxt/eslint",
    "@nuxt/icon",
    "@pinia/nuxt",
    "@nuxtjs/color-mode",
    "@nuxt/fonts",

  ],

  pinia: {
    storesDirs: ["./app/stores"],
  },

  shadcn: {
    /**
     * Prefix for all the imported component
     */
    prefix: "",
    /**
     * Directory that the component lives in.
     * @default "~/components/ui"
     */
    componentDir: "~/components/ui",
  },

  colorMode: {
    classSuffix: "",
  },

  eslint: {
    config: {
      standalone: false,
    },
  },

  fonts: {
    defaults: {
      weights: [300, 400, 500, 600, 700, 800],
    },
  },

  // routeRules: {
  //   '/components': { redirect: '/components/accordion' },
  //   '/settings': { redirect: '/settings/profile' },
  // },

  imports: {
    dirs: [
      "./lib",
    ],
  },

  runtimeConfig: {
    databaseUrl: "", // NUXT_DATABASE_URL env variable
    apiUrl: "", // NUXT_API_URL env variable
    public: {
      // eslint-disable-next-line node/no-process-env
      isProd: process.env.NODE_ENV === "production",
    },
  },

  compatibilityDate: "2024-12-14",
});
