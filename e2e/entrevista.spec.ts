import { expect, type Page, test } from "@playwright/test";

const PREGUNTAS = [
  "Cuéntanos un día normal en tu trabajo: ¿qué haces desde que llegas?",
  "Recuerda una vez que resolviste un problema en el trabajo. ¿Qué pasó y qué hiciste?",
  "¿Qué es lo que mejor sabes hacer y por qué te lo reconocen?",
];
const AVISO_QVAC =
  "El análisis usa QVAC, el motor de IA local-first de Tether, con validación determinista sobre el catálogo CNPO del MTPE: solo se aceptan competencias que existen en él.";

type RespuestaSimulada = { status: number; cuerpo: unknown };

/** Intercepta /api/traducir: los E2E nunca dependen de que QVAC esté corriendo. */
async function simularQvac(page: Page, respuesta: RespuestaSimulada) {
  const relatosRecibidos: unknown[] = [];
  await page.route("**/api/traducir", async (ruta) => {
    relatosRecibidos.push(ruta.request().postDataJSON());
    await ruta.fulfill({
      status: respuesta.status,
      contentType: "application/json",
      body: JSON.stringify(respuesta.cuerpo),
    });
  });
  return relatosRecibidos;
}

async function abrirEntrevista(page: Page) {
  await page.goto("/entrevista/");
  await page.waitForFunction(() => document.querySelector("astro-island[ssr]") === null);
}

test("la entrevista muestra el titular, las 3 preguntas y el aviso de QVAC", async ({ page }) => {
  await abrirEntrevista(page);
  await expect(page.locator("h1")).toHaveText("Cuéntanos tu experiencia");
  for (const pregunta of PREGUNTAS) {
    await expect(page.getByLabel(pregunta)).toBeVisible();
  }
  await expect(page.locator("body")).toContainText(AVISO_QVAC);
});

test("muestra las competencias de QVAC y sugiere de 1 a 3 ocupaciones sin usar el almacenamiento", async ({
  page,
}) => {
  const recibidos = await simularQvac(page, {
    status: 200,
    cuerpo: {
      detectadas: [
        { id: "C03", evidencias: ["cobro con yape"] },
        { id: "C04", evidencias: ["cuadro la caja"] },
      ],
      modo: "qvac",
    },
  });
  await abrirEntrevista(page);
  await page.getByLabel(PREGUNTAS[0] as string).fill("cobro con yape y cuadro la caja al cierre");

  const peticiones: string[] = [];
  page.on("request", (peticion) => peticiones.push(new URL(peticion.url()).pathname));
  await page.getByRole("button", { name: "Ver mis competencias" }).click();

  await expect(page.getByText("Cobro con medios de pago electrónicos")).toBeVisible();
  await expect(page.getByText("Analizado con QVAC.")).toBeVisible();
  const enlaces = await page.locator('main a[href^="/ocupaciones/"]').count();
  expect(enlaces).toBeGreaterThanOrEqual(1);
  expect(enlaces).toBeLessThanOrEqual(3);
  // La única petición es a nuestro propio endpoint, con los relatos tal cual.
  expect(peticiones).toEqual(["/api/traducir"]);
  expect(recibidos).toHaveLength(1);
  expect(recibidos[0]).toMatchObject({
    relatos: ["cobro con yape y cuadro la caja al cierre", "", ""],
  });

  const almacenamiento = await page.evaluate(() => ({
    local: window.localStorage.length,
    sesion: window.sessionStorage.length,
  }));
  expect(almacenamiento).toEqual({ local: 0, sesion: 0 });
});

test("si QVAC no está disponible usa el respaldo por palabras clave y lo dice", async ({
  page,
}) => {
  await simularQvac(page, { status: 502, cuerpo: { error: "qvac_unavailable" } });
  await abrirEntrevista(page);
  await page.getByLabel(PREGUNTAS[0] as string).fill("cobro con yape y cuadro la caja al cierre");
  await page.getByRole("button", { name: "Ver mis competencias" }).click();

  await expect(page.getByText("Cobro con medios de pago electrónicos")).toBeVisible();
  await expect(
    page.getByText("QVAC no estuvo disponible: resultado de la simulación por palabras clave."),
  ).toBeVisible();
});

test("pide más texto cuando las respuestas son demasiado cortas", async ({ page }) => {
  const recibidos = await simularQvac(page, { status: 200, cuerpo: { detectadas: [] } });
  await abrirEntrevista(page);
  for (const pregunta of PREGUNTAS) {
    await page.getByLabel(pregunta).fill("hola");
  }
  await page.getByRole("button", { name: "Ver mis competencias" }).click();
  await expect(page.getByRole("alert")).toHaveText(
    "Escribe al menos 15 caracteres en alguna de las respuestas.",
  );
  await expect(page.locator("body")).not.toContainText(
    "Posibles competencias mencionadas en tu relato",
  );
  expect(recibidos).toHaveLength(0);
});

test("avisa cuando no encuentra competencias", async ({ page }) => {
  await simularQvac(page, { status: 200, cuerpo: { detectadas: [], modo: "qvac" } });
  await abrirEntrevista(page);
  await page.getByLabel(PREGUNTAS[0] as string).fill("me gusta mucho el futbol los domingos");
  await page.getByRole("button", { name: "Ver mis competencias" }).click();
  await expect(
    page.getByText(
      "No encontramos competencias en lo que escribiste. Cuéntanos con más detalle qué haces en tu trabajo.",
    ),
  ).toBeVisible();
});

test.describe("sin JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("el envío queda deshabilitado y las respuestas no viajan por la URL", async ({ page }) => {
    await page.goto("/entrevista/");
    const boton = page.getByRole("button", { name: "Ver mis competencias" });
    await expect(boton).toBeDisabled();
    await page.getByLabel(PREGUNTAS[0] as string).fill("cobro con yape y cuadro la caja al cierre");
    await boton.click({ force: true, timeout: 2000 }).catch(() => undefined);
    expect(page.url()).not.toContain("?");
    expect(page.url()).toMatch(/\/entrevista\/$/);
  });
});
