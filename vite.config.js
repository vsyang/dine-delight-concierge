import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({

  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main:        resolve(__dirname, "index.html"),
        preferences: resolve(__dirname, "preferences.html"),
        result:      resolve(__dirname, "result.html"),
      },
    },
  },
});
