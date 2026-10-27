import { expect, test } from "@playwright/test";

const AVISO =
  "Prototipo para el Innovathon Ulima x Tether. No es un sitio oficial del Estado peruano.";

test("el layout fija idioma, título, aviso y fuentes", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(page).toHaveTitle("Inicio | Reconversión Laboral");
  await expect(page.getByTestId("aviso-prototipo")).toContainText(AVISO);
  await expect(page.locator("footer")).toContainText(
    "Catálogo Nacional de Perfiles Ocupacionales (CNPO)",
  );
  await expect(page.locator("img")).toHaveCount(0);
});

test("el primer Tab enfoca el enlace para saltar al contenido", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const enfocado = page.locator(":focus");
  await expect(enfocado).toHaveText("Saltar al contenido");
  await expect(enfocado).toHaveAttribute("href", "#contenido");
  await expect(page.locator("main#contenido")).toHaveCount(1);
});
