import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// Sitio 100 % estático: todas las páginas se prerenderizan en dist/. El puente hacia QVAC
// (/api/traducir) es una función de Cloudflare Pages en functions/api/traducir.ts, que
// Cloudflare publica junto al sitio. React solo en islas (client:load).
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
