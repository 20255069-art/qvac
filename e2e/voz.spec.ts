import { expect, test } from "@playwright/test";

const DICTAR = /^Dictar por voz la respuesta/;

test.describe("con dictado disponible", () => {
  // Micrófono y reconocedor simulados: el flujo completo corre sin hardware ni red.
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      navigator.mediaDevices.getUserMedia = async () => {
        const contexto = new AudioContext();
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
                results: [
                  [{ transcript: "cobro con yape" }],
                  [{ transcript: " y cuadro la caja" }],
                ],
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

  test("hay un botón de dictado con nombre propio bajo cada pregunta", async ({ page }) => {
    await expect(page.getByRole("button", { name: DICTAR })).toHaveCount(3);
    await expect(page.getByRole("button", { name: "Dictar por voz la respuesta 2" })).toHaveCount(
      1,
    );
  });

  test("dictar escribe en el textarea, conserva lo escrito y bloquea lo demás", async ({
    page,
  }) => {
    const area = page.locator("#respuesta-0");
    await area.fill("Trabajo en un súper.");
    await page.getByRole("button", { name: "Dictar por voz la respuesta 1" }).click();

    const detener = page.getByRole("button", { name: "Detener dictado de la respuesta 1" });
    await expect(detener).toHaveAttribute("aria-pressed", "true");
    await expect(area).toHaveValue("Trabajo en un súper. cobro con yape y cuadro la caja");
    await expect(
      page.getByRole("button", { name: "Dictar por voz la respuesta 2" }),
    ).toBeDisabled();
    await expect(page.getByRole("button", { name: "Ver mis competencias" })).toBeDisabled();

    await detener.click();
    await expect(page.getByRole("button", { name: DICTAR })).toHaveCount(3);
    await expect(page.getByRole("button", { name: "Ver mis competencias" })).toBeEnabled();
  });
});

test("si el navegador corta por silencio, el dictado se reanuda y conserva lo dicho", async ({
  page,
}) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () =>
      new AudioContext().createMediaStreamDestination().stream;
    let sesion = 0;
    class ReconocedorQueSeCorta {
      lang = "";
      continuous = false;
      interimResults = false;
      onresult: ((evento: unknown) => void) | null = null;
      onerror: ((evento: unknown) => void) | null = null;
      onend: (() => void) | null = null;
      start() {
        sesion += 1;
        const texto = sesion === 1 ? "cobro con yape" : "y cuadro la caja";
        setTimeout(() => {
          this.onresult?.({ results: [Object.assign([{ transcript: texto }], { isFinal: true })] });
          if (sesion === 1) {
            this.onend?.(); // Chrome termina la sesión tras un silencio
          }
        }, 50);
      }
      stop() {
        this.onend?.();
      }
    }
    (window as unknown as { SpeechRecognition: unknown }).SpeechRecognition = ReconocedorQueSeCorta;
  });
  await page.goto("/entrevista/");
  await page.getByRole("button", { name: "Dictar por voz la respuesta 1" }).click();
  await expect(page.locator("#respuesta-0")).toHaveValue("cobro con yape y cuadro la caja");
  await expect(
    page.getByRole("button", { name: "Detener dictado de la respuesta 1" }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("sin soporte de voz no se muestran botones de dictado", async ({ page }) => {
  await page.addInitScript(() => {
    const ventana = window as unknown as Record<string, unknown>;
    ventana.SpeechRecognition = undefined;
    ventana.webkitSpeechRecognition = undefined;
  });
  await page.goto("/entrevista/");
  await expect(page.getByRole("button", { name: "Ver mis competencias" })).toBeEnabled();
  await expect(page.getByRole("button", { name: DICTAR })).toHaveCount(0);
});
