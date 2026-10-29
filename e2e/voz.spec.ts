import { expect, test } from "@playwright/test";

// Micrófono y reconocedor simulados: el flujo completo corre sin hardware ni red.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      const contexto = new AudioContext();
      contexto.createOscillator().connect(contexto.createMediaStreamDestination());
      return contexto.createMediaStreamDestination().stream;
    };
    class ReconocedorFalso {
      lang = "";
      continuous = false;
      interimResults = false;
      onresult: ((evento: unknown) => void) | null = null;
      onerror: ((evento: unknown) => void) | null = null;
      onend: (() => void) | null = null;
      start() {
        setTimeout(() => this.onresult?.({ results: [[{ transcript: "cobro con yape" }]] }), 50);
        setTimeout(
          () =>
            this.onresult?.({
              results: [[{ transcript: "cobro con yape" }], [{ transcript: " y cuadro la caja" }]],
            }),
          120,
        );
      }
      stop() {
        this.onend?.();
      }
    }
    (window as unknown as { SpeechRecognition: unknown }).SpeechRecognition = ReconocedorFalso;
  });
  await page.goto("/entrevista/");
  await expect(page.getByRole("button", { name: "Ver mis competencias" })).toBeEnabled();
});

test("hay un botón de dictado bajo cada una de las 3 preguntas", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Dictar con voz" })).toHaveCount(3);
});

test("dictar escribe en el textarea, conserva lo ya escrito y se detiene", async ({ page }) => {
  const area = page.locator("#respuesta-0");
  await area.fill("Trabajo en un súper.");
  await page.getByRole("button", { name: "Dictar con voz" }).first().click();
  await expect(page.getByRole("button", { name: "Detener dictado" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(area).toHaveValue("Trabajo en un súper. cobro con yape y cuadro la caja");
  await page.getByRole("button", { name: "Detener dictado" }).click();
  await expect(page.getByRole("button", { name: "Dictar con voz" })).toHaveCount(3);
});

test("sin soporte de voz avisa y deja escribir", async ({ page }) => {
  await page.evaluate(() => {
    (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition = undefined;
    (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition =
      undefined;
  });
  await page.getByRole("button", { name: "Dictar con voz" }).first().click();
  await expect(page.getByRole("alert")).toContainText("no permite dictar por voz");
});
