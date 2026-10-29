import { cpSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(__dirname, "..");
const distClient = resolve(raiz, "dist/client");
const dist = resolve(raiz, "dist");

// Garantiza compatibilidad universal con Cloudflare Pages:
// Ya sea que Cloudflare esté configurado con output directory "dist" o "dist/client",
// siempre encontrará index.html y los assets sin importar la configuración del dashboard.
if (existsSync(distClient)) {
  console.log("[Postbuild] Sincronizando dist/client a dist para Cloudflare Pages...");
  try {
    cpSync(distClient, dist, { recursive: true });
    console.log("[Postbuild] ✓ dist e index.html listos para Cloudflare Pages.");
  } catch (err) {
    console.error("[Postbuild] Error al sincronizar:", err);
  }
}
