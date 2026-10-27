import { expect, test } from "@playwright/test";

test("el ranking de caja_comercial muestra 8 destinos ordenados por afinidad", async ({ page }) => {
  await page.goto("/ocupaciones/caja_comercial/");
  await expect(page.locator("h1")).toHaveText("De Cajero(a) de tienda a otros trabajos");
  const filas = page.locator('[data-testid="destino"]');
  await expect(filas).toHaveCount(8);
  await expect(page.locator('a[href="/transicion/caja_comercial/caja_comercial/"]')).toHaveCount(0);

  const afinidades = (await filas.evaluateAll((nodos) =>
    nodos.map((nodo) => nodo.getAttribute("data-afinidad")),
  )) as string[];
  const numeros = afinidades.map(Number);
  for (let i = 1; i < numeros.length; i += 1) {
    expect(numeros[i - 1] ?? 0).toBeGreaterThanOrEqual(numeros[i] ?? 0);
  }
});

test("cada fila muestra cobertura, demanda referencial y enlace al detalle", async ({ page }) => {
  await page.goto("/ocupaciones/caja_comercial/");
  const filas = page.locator('[data-testid="destino"]');
  const total = await filas.count();
  for (let i = 0; i < total; i += 1) {
    const fila = filas.nth(i);
    await expect(fila).toContainText(/Ya tienes el \d{1,3} % de lo que pide este trabajo/);
    await expect(fila).toContainText(/Demanda referencial: (Alta|Media|Baja)/);
    const href = await fila.locator("a").first().getAttribute("href");
    expect(href?.startsWith("/transicion/caja_comercial/")).toBe(true);
  }
});

test("la página aclara que la demanda es referencial y no se desborda a 360 px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/ocupaciones/caja_comercial/");
  await expect(page.locator("body")).toContainText(
    "Se reemplazará con la Encuesta de Demanda Ocupacional 2026 del MTPE",
  );
  const ancho = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(ancho).toBeLessThanOrEqual(360);
});

test("limpieza y salon_comidas también muestran 8 filas", async ({ page }) => {
  for (const id of ["limpieza", "salon_comidas"]) {
    await page.goto(`/ocupaciones/${id}/`);
    await expect(page.locator('[data-testid="destino"]')).toHaveCount(8);
  }
});
