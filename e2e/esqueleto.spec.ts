import { expect, test } from "@playwright/test";

test("la portada construida responde 200 y tiene un solo h1 visible", async ({ page }) => {
  const respuesta = await page.goto("/");
  expect(respuesta?.status()).toBe(200);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("h1")).toBeVisible();
});

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
    fondo: "rgb(255, 255, 255)",
    color: "rgb(31, 41, 51)",
    tamano: "18px",
  });
});
