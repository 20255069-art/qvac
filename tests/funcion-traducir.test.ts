import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestPost } from "../functions/api/traducir.ts";

const pedir = (
  cuerpo: unknown,
  env: { QVAC_ENDPOINT?: string; QVAC_TOKEN?: string } = {
    QVAC_ENDPOINT: "https://qvac.ejemplo/v1/chat/completions",
  },
) =>
  onRequestPost({
    request: new Request("https://sitio/api/traducir", {
      method: "POST",
      body: JSON.stringify(cuerpo),
    }),
    env,
  });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("función /api/traducir (Cloudflare Pages)", () => {
  it("devuelve lo que QVAC detecta, validado contra el catálogo", async () => {
    const contenido = JSON.stringify({
      detectadas: [{ id: "C03", evidencias: ["yape"] }, { id: "C99" }],
    });
    const falso = vi.fn(async (_url: string) =>
      Response.json({ choices: [{ message: { content: contenido } }] }),
    );
    vi.stubGlobal("fetch", falso);

    const respuesta = await pedir({ relatos: ["cobro con yape"] });

    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual({
      detectadas: [{ id: "C03", evidencias: ["yape"] }],
      modo: "qvac",
    });
    expect(falso.mock.calls[0]?.[0]).toBe("https://qvac.ejemplo/v1/chat/completions");
  });

  it("si QVAC falla responde 502 y registra el diagnóstico sin el token", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("model not found", { status: 404 })),
    );
    const registro = vi.spyOn(console, "error").mockImplementation(() => {});

    const respuesta = await pedir(
      { relatos: ["cobro con yape"] },
      { QVAC_ENDPOINT: "https://qvac.ejemplo/v1", QVAC_TOKEN: "secreto" },
    );

    expect(respuesta.status).toBe(502);
    const impreso = JSON.stringify(registro.mock.calls);
    expect(impreso).toContain("https://qvac.ejemplo/v1");
    expect(impreso).toContain('"tokenConfigurado":true');
    expect(impreso).not.toContain("secreto");
  });

  it("rechaza una petición mal formada", async () => {
    expect((await pedir({ relatos: "no es lista" })).status).toBe(400);
  });
});
