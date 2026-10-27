import { expect, type Page, test } from "@playwright/test";

const PREGUNTAS = [
  "Cuéntanos un día normal en tu trabajo: ¿qué haces desde que llegas?",
  "Recuerda una vez que resolviste un problema en el trabajo. ¿Qué pasó y qué hiciste?",
  "¿Qué es lo que mejor sabes hacer y por qué te lo reconocen?",
];
const AVISO_QVAC =
  "Traducción simulada por palabras clave. En la versión final la realizará la IA local QVAC de Tether.";

async function abrirEntrevista(page: Page) {
  await page.goto("/entrevista/");
  await page.waitForFunction(() => document.querySelector("astro-island[ssr]") === null);
}

test("la entrevista muestra el titular, las 3 preguntas y el aviso de simulación", async ({
  page,
}) => {
  await abrirEntrevista(page);
  await expect(page.locator("h1")).toHaveText("Cuéntanos tu experiencia");
  for (const pregunta of PREGUNTAS) {
    await expect(page.getByLabel(pregunta)).toBeVisible();
  }
  await expect(page.locator("body")).toContainText(AVISO_QVAC);
});

test("reconoce competencias y sugiere de 1 a 3 ocupaciones sin usar la red ni el almacenamiento", async ({
  page,
}) => {
  await abrirEntrevista(page);
  await page.getByLabel(PREGUNTAS[0] as string).fill("cobro con yape y cuadro la caja al cierre");

  const peticiones: string[] = [];
  page.on("request", (peticion) => peticiones.push(peticion.url()));
  await page.getByRole("button", { name: "Ver mis competencias" }).click();

  await expect(page.getByText("Cobro con medios de pago electrónicos")).toBeVisible();
  const enlaces = await page.locator('main a[href^="/ocupaciones/"]').count();
  expect(enlaces).toBeGreaterThanOrEqual(1);
  expect(enlaces).toBeLessThanOrEqual(3);
  expect(peticiones).toHaveLength(0);

  const almacenamiento = await page.evaluate(() => ({
    local: window.localStorage.length,
    sesion: window.sessionStorage.length,
  }));
  expect(almacenamiento).toEqual({ local: 0, sesion: 0 });
});

test("pide más texto cuando las respuestas son demasiado cortas", async ({ page }) => {
  await abrirEntrevista(page);
  for (const pregunta of PREGUNTAS) {
    await page.getByLabel(pregunta).fill("hola");
  }
  await page.getByRole("button", { name: "Ver mis competencias" }).click();
  await expect(page.getByRole("alert")).toHaveText(
    "Escribe al menos 15 caracteres en alguna de las respuestas.",
  );
  await expect(page.locator("body")).not.toContainText("Competencias que reconocimos");
});

test("avisa cuando no encuentra competencias", async ({ page }) => {
  await abrirEntrevista(page);
  await page.getByLabel(PREGUNTAS[0] as string).fill("me gusta mucho el futbol los domingos");
  await page.getByRole("button", { name: "Ver mis competencias" }).click();
  await expect(
    page.getByText(
      "No encontramos competencias en lo que escribiste. Cuéntanos con más detalle qué haces en tu trabajo.",
    ),
  ).toBeVisible();
});
