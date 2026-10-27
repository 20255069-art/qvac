import { defineConfig, devices } from "@playwright/test";

// Playwright construye el sitio y lo sirve con `astro preview` en 127.0.0.1:4321.
// Reporter "list": nunca abre un servidor de reportes que bloquee una ejecución desatendida.
export default defineConfig({
  testDir: "e2e",
  testIgnore: ["**/blueprints/**"],
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4321",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    {
      name: "movil",
      use: { ...devices["Desktop Chrome"], viewport: { width: 360, height: 740 } },
    },
  ],
  webServer: {
    command: "npm run build && npm run preview",
    url: "http://127.0.0.1:4321",
    reuseExistingServer: false,
    timeout: 180000,
  },
});
