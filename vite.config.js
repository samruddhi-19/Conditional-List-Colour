import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        powerup: resolve(__dirname, "powerup.html"),
        auth: resolve(__dirname, "auth.html"),
        settings: resolve(__dirname, "settings.html"),
        rules: resolve(__dirname, "rules.html"),
      },
    },
  },
  server: {
    port: 5175,
    cors: true,
  },
});
