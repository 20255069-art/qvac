import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PAGINAS = [
  "/",
  "/ocupaciones/",
  "/ocupaciones/caja_comercial/",
  "/transicion/caja_comercial/almacen/",
  "/entrevista/",
];

for (const ruta of PAGINAS) {
  test(`axe sin violaciones serias ni críticas en ${ruta}`, async ({ page }) => {
    await page.goto(ruta);
    const resultado = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const graves = resultado.violations.filter(
      (violacion) => violacion.impact === "critical" || violacion.impact === "serious",
    );
    expect(graves.map((violacion) => `${violacion.id}: ${violacion.help}`)).toEqual([]);
  });

  test(`sin scroll horizontal a 360 px en ${ruta}`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto(ruta);
    const ancho = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(ancho).toBeLessThanOrEqual(360);
  });
}
