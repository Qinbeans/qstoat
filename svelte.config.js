import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

export default {
  // Enable TypeScript preprocessing in .svelte files
  preprocess: vitePreprocess(),
};
