import { expect, test } from "@playwright/test";

const AVISO =
  "Prototipo para el Innovathon Ulima x Tether. No es un sitio oficial del Estado peruano.";

const RUTAS = [
  ["/", "Lo que ya sabes hacer vale en otros trabajos"],
  ["/ocupaciones/", "Elige tu ocupación"],
  ["/ocupaciones/caja_comercial/", "De Cajero(a) de tienda a otros trabajos"],
  ["/ocupaciones/limpieza/", "De Operario(a) de limpieza a otros trabajos"],
  ["/ocupaciones/salon_comidas/", "De Mozo(a) / ayudante de salón a otros trabajos"],
  ["/transicion/caja_comercial/almacen/", "De Cajero(a) de tienda a Operario(a) de almacén"],
  ["/transicion/limpieza/housekeeping/", "De Operario(a) de limpieza a Cuartelero(a) de hotel"],
  [
    "/transicion/salon_comidas/atencion_telefonica/",
    "De Mozo(a) / ayudante de salón a Teleoperador(a)",
  ],
  ["/entrevista/", "Cuéntanos tu experiencia"],
  ["/acerca/", "Cómo funciona este prototipo"],
] as const;

for (const [ruta, titular] of RUTAS) {
  test(`${ruta} responde 200 con su h1 y el aviso de prototipo`, async ({ page }) => {
    const respuesta = await page.goto(ruta);
    expect(respuesta?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveText(titular);
    await expect(page.getByTestId("aviso-prototipo")).toContainText(AVISO);
  });
}

test("una ruta inexistente muestra la página 404 con un enlace al inicio", async ({ page }) => {
  await page.goto("/ruta-que-no-existe/");
  await expect(page.locator("body")).toContainText("No encontramos esta página");
  await expect(page.getByRole("link", { name: "Volver al inicio" })).toHaveAttribute("href", "/");
});

test("la metodología menciona el CNPO, la demanda referencial y Compras", async ({ page }) => {
  await page.goto("/acerca/");
  const cuerpo = page.locator("body");
  await expect(cuerpo).toContainText("CNPO");
  await expect(cuerpo).toContainText("Demanda referencial");
  await expect(cuerpo).toContainText("H2452004");
});
