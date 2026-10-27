import { expect, test } from "@playwright/test";

const IDS = [
  "almacen",
  "atencion_telefonica",
  "caja_comercial",
  "caja_financiera",
  "housekeeping",
  "lavanderia",
  "limpieza",
  "salon_comidas",
  "trabajador_hogar",
];

test("el directorio responde 200 con su titular y su título", async ({ page }) => {
  const respuesta = await page.goto("/ocupaciones/");
  expect(respuesta?.status()).toBe(200);
  await expect(page.locator("h1")).toHaveText("Elige tu ocupación");
  await expect(page).toHaveTitle("Elige tu ocupación | Reconversión Laboral");
});

test("hay un enlace por cada una de las 9 ocupaciones", async ({ page }) => {
  await page.goto("/ocupaciones/");
  for (const id of IDS) {
    await expect(page.locator(`main a[href="/ocupaciones/${id}/"]`)).toHaveCount(1);
  }
  await expect(page.locator('main a[href="/ocupaciones/caja_comercial/"]')).toHaveText(
    "Cajero(a) de tienda",
  );
});

test("no hay scroll horizontal a 360 px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/ocupaciones/");
  const ancho = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(ancho).toBeLessThanOrEqual(360);
});
