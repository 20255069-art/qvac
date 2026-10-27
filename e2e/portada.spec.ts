import { expect, test } from "@playwright/test";

const FUENTE =
  "Fuente: IEES (Sociedad Nacional de Industrias) con datos INEI-EPEN, Reporte Estadístico Laboral N° 02-2026";

test("la portada muestra el titular, el dato de informalidad y su fuente", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toHaveText("Lo que ya sabes hacer vale en otros trabajos");
  await expect(page.locator("body")).toContainText("69,8 %");
  await expect(page.locator("body")).toContainText(FUENTE);
});

test("los dos llamados llevan a su destino y miden al menos 48 px de alto", async ({ page }) => {
  await page.goto("/");
  const ocupaciones = page.getByRole("link", { name: "Elige tu ocupación" });
  const entrevista = page.getByRole("link", { name: "Cuéntanos tu experiencia" });
  await expect(ocupaciones).toHaveAttribute("href", "/ocupaciones/");
  await expect(entrevista).toHaveAttribute("href", "/entrevista/");
  for (const enlace of [ocupaciones, entrevista]) {
    const caja = await enlace.boundingBox();
    expect(caja?.height ?? 0).toBeGreaterThanOrEqual(48);
  }
});

test("explica el uso en exactamente 3 pasos", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("main ol > li")).toHaveCount(3);
});

test("no hay scroll horizontal a 360 px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/");
  const ancho = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(ancho).toBeLessThanOrEqual(360);
});
