import { expect, test } from "@playwright/test";

test("el directorio muestra un ícono distinto por ocupación", async ({ page }) => {
  await page.goto("/ocupaciones/");
  const iconos = page.locator("svg[data-icono]");
  await expect(iconos).toHaveCount(9);
  const ids = await iconos.evaluateAll((nodos) => nodos.map((n) => n.getAttribute("data-icono")));
  expect(new Set(ids).size).toBe(9);
  for (const icono of await iconos.all()) {
    await expect(icono).toHaveAttribute("aria-hidden", "true");
  }
});

test("la transición muestra el ícono de origen y el de destino", async ({ page }) => {
  await page.goto("/transicion/caja_comercial/almacen/");
  await expect(page.locator('svg[data-icono="caja_comercial"]')).toHaveCount(1);
  await expect(page.locator('svg[data-icono="almacen"]')).toHaveCount(1);
});

test.describe("con movimiento reducido", () => {
  test.use({ reducedMotion: "reduce" });

  test("los íconos no se animan", async ({ page }) => {
    await page.goto("/ocupaciones/");
    const animacion = await page
      .locator("svg[data-icono] .ico-trazo")
      .first()
      .evaluate((trazo) => getComputedStyle(trazo).animationName);
    expect(animacion).toBe("none");
  });
});

test("toda la tarjeta de una ocupación lleva a su página", async ({ page }) => {
  await page.goto("/ocupaciones/");
  const tarjeta = page.locator("li.tarjeta-enlace").first();
  const caja = await tarjeta.boundingBox();
  if (caja === null) throw new Error("tarjeta sin tamaño");
  await page.mouse.click(caja.x + 12, caja.y + caja.height - 12);
  await expect(page).toHaveURL(/\/ocupaciones\/[a-z_]+\/$/);
});

test("toda la fila de un destino lleva a su transición", async ({ page }) => {
  await page.goto("/ocupaciones/limpieza/");
  const fila = page.getByTestId("destino").first();
  const caja = await fila.boundingBox();
  if (caja === null) throw new Error("fila sin tamaño");
  await page.mouse.click(caja.x + caja.width - 20, caja.y + 20);
  await expect(page).toHaveURL(/\/transicion\/limpieza\/[a-z_]+\/$/);
});
