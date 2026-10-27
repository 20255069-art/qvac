import { defineConfig } from "vitest/config";

// Solo pruebas unitarias en tests/. Los E2E (e2e/) son de Playwright y la carpeta
// blueprints/ (el plano del proyecto) nunca se recorre.
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    exclude: ["blueprints/**", "node_modules/**", "dist/**", "e2e/**"],
    environment: "node",
    passWithNoTests: false,
  },
});
