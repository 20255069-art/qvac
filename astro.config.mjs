import node from "@astrojs/node";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// Salida estática por defecto: todas las páginas (incluidas las de getStaticPaths) se
// prerenderizan. Solo las rutas con `export const prerender = false` (hoy únicamente
// src/pages/api/traducir.ts, el puente hacia QVAC) se sirven bajo demanda con el adaptador
// de Node. React solo en islas (client:load).
export default defineConfig({
  output: "static",
  adapter: node({ mode: "standalone" }),
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
