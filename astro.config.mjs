import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// Sitio 100 % estático: sin adaptador, sin servidor. React solo en islas (client:load).
export default defineConfig({
  output: "static",
  outDir: "./dist",
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
  build: {
    format: "directory",
  },
  trailingSlash: "ignore",
});
