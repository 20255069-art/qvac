import { expect, test } from "@playwright/test";

const AVISO =
  "Esta es una orientación preliminar. No evalúa ni certifica; la certificación la otorgan entidades autorizadas.";

test("la transición de caja_comercial a almacen muestra resumen, evidencia y cursos", async ({
  page,
}) => {
  await page.goto("/transicion/caja_comercial/almacen/");
  await expect(page.locator("h1")).toHaveText("De Cajero(a) de tienda a Operario(a) de almacén");
  await expect(page.locator('[data-testid="resumen"]')).toHaveText(
    /Ya tienes el \d{1,3} % de lo que pide este trabajo/,
  );

  const yaTienes = page.locator('[data-testid="ya-tienes"]');
  const porFortalecer = page.locator('[data-testid="por-fortalecer"]');
  expect((await yaTienes.count()) + (await porFortalecer.count())).toBeGreaterThan(0);

  for (let i = 0; i < (await yaTienes.count()); i += 1) {
    const fila = yaTienes.nth(i);
    await expect(fila).toContainText("Ya lo tienes");
    await expect(fila).toContainText(/G2347002-\d+-E\d+/);
    await expect(fila).toContainText(/H2452001-\d+-E\d+/);
  }

  for (let i = 0; i < (await porFortalecer.count()); i += 1) {
    const fila = porFortalecer.nth(i);
    await expect(fila).toContainText("Por fortalecer");
    await expect(fila).toContainText(/H2452001-\d+-E\d+/);
    await expect(fila).toContainText(/Busca el tema «.+» en Capacíta-T \(gratuito\)/);
    await expect(fila.locator('a[href="https://capacitacionlaboral.trabajo.gob.pe/"]')).toHaveCount(
      1,
    );
  }

  await expect(page.locator("body")).toContainText(AVISO);
});

test("no hay scroll horizontal a 360 px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/transicion/caja_comercial/almacen/");
  const ancho = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(ancho).toBeLessThanOrEqual(360);
});

const OTRAS = [
  ["/transicion/limpieza/housekeeping/", "De Operario(a) de limpieza a Cuartelero(a) de hotel"],
  [
    "/transicion/salon_comidas/atencion_telefonica/",
    "De Mozo(a) / ayudante de salón a Teleoperador(a)",
  ],
] as const;

for (const [ruta, titular] of OTRAS) {
  test(`${ruta} muestra su titular y el aviso`, async ({ page }) => {
    await page.goto(ruta);
    await expect(page.locator("h1")).toHaveText(titular);
    await expect(page.locator("body")).toContainText(AVISO);
  });
}
