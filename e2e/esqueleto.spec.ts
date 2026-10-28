import { expect, test } from "@playwright/test";

test("los tokens de global.css se aplican al body", async ({ page }) => {
  await page.goto("/");
  const estilos = await page.locator("body").evaluate((body) => {
    const calculado = getComputedStyle(body);
    return {
      fondo: calculado.backgroundColor,
      color: calculado.color,
      tamano: calculado.fontSize,
    };
  });
  expect(estilos).toEqual({
    fondo: "rgb(242, 246, 251)", // fondo gris de página (superficie), estilo gob.pe
    color: "rgb(31, 41, 51)",
    tamano: "18px",
  });
});
