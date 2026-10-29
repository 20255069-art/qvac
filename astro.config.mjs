import node from "@astrojs/node";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// Salida estática por defecto: todas las páginas (incluidas las de getStaticPaths) se
// prerenderizan. Solo las rutas con `export const prerender = false` (src/pages/api/traducir.ts,
// el puente SSR hacia QVAC) se sirven bajo demanda con el adaptador Node SSR. React solo en islas (client:load).
export default defineConfig({
  output: "static",
  adapter: node({ mode: "standalone" }),
  outDir: "./dist",
  security: {
    checkOrigin: false,
  },
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: true,
    },
  },
  build: {
    format: "directory",
  },
  trailingSlash: "ignore",
});
