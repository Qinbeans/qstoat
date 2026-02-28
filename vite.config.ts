import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const base = process.env.BASE_PATH ?? "/";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  base,
  // prevent Vite from obscuring rust errors
  clearScreen: false,
  plugins: [tailwindcss(), svelte()],
  // tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
  build: {
    target: "esnext",
    sourcemap: true,
  },
});
