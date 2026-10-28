import { expect, test } from "@playwright/test";

const AVISO =
  "Esta es una orientación preliminar. No evalúa ni certifica; la certificación la otorgan entidades autorizadas.";

test("la transición de caja_comercial a almacen muestra resumen, evidencia y cursos", async ({
  page,
}) => {
  await page.goto("/transicion/caja_comercial/almacen/");
  await expect(page.locator("h1")).toHaveText("De Cajero(a) de tienda a Operario(a) de almacén");
  await expect(page.locator('[data-testid="resumen"]')).toHaveText(
    /Los perfiles comparten el \d{1,3} % de las competencias mapeadas/,
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
