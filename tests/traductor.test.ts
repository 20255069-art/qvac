import { describe, expect, it, vi } from "vitest";
import { competencias, mapeo, ocupaciones } from "../src/lib/datos.ts";
import { competenciasPorOcupacion, sugerirOcupaciones } from "../src/lib/sugerencias.ts";
import { crearTraductorPalabrasClave } from "../src/lib/traductor/palabras-clave.ts";
import { crearTraductorQvac, type ModoTraduccion } from "../src/lib/traductor/qvac.ts";
import {
  interpretarRespuestaQvac,
  limpiarContenido,
  pedirClasificacionQvac,
} from "../src/lib/traductor/qvac-protocolo.ts";
import { datosMinimos } from "./fixtures/datos-minimos.ts";

const traducir = crearTraductorPalabrasClave(competencias);

describe("traductor por palabras clave", () => {
  it("detecta medios de pago electrónicos y cuadre de caja", async () => {
    const detectadas = await traducir(["cobro con yape y cuadro la caja al cierre"]);
    const c03 = detectadas.find((d) => d.id === "C03");
    const c04 = detectadas.find((d) => d.id === "C04");
    expect(c03?.palabrasEncontradas).toContain("yape");
    expect(c04?.palabrasEncontradas).toContain("cuadro");
  });

  it("ignora tildes y mayúsculas", async () => {
    const detectadas = await traducir(["Uso lejía para desinfectar los baños"]);
    const c11 = detectadas.find((d) => d.id === "C11");
    expect(c11?.palabrasEncontradas).toContain("lejia");
  });

  it("devuelve una lista vacía con relatos vacíos o solo espacios", async () => {
    expect(await traducir([""])).toEqual([]);
    expect(await traducir(["   "])).toEqual([]);
  });

  it("no cuenta una competencia negada", async () => {
    expect(await traducir(["No sé cobrar ni usar Yape"])).toEqual([]);
    expect(await traducir(["Nunca he usado yape ni he manejado una caja"])).toEqual([]);
  });

  it("sí cuenta la competencia afirmada aunque haya otra negada antes", async () => {
    const detectadas = await traducir(["No uso efectivo, pero cobro con yape"]);
    expect(detectadas.map((d) => d.id)).toContain("C03");
  });

  it("no confunde palabras generales con otra competencia", async () => {
    const equipo = await traducir(["Trabajo en equipo con mis compañeros"]);
    expect(equipo.some((d) => d.id === "C12")).toBe(false);
    expect(equipo.some((d) => d.id === "C27")).toBe(true);
    const pedidos = await traducir(["Me toca preparar pedidos en el almacén"]);
    expect(pedidos.some((d) => d.id === "C17")).toBe(false);
  });

  it("reconoce formas habituales como «limpio»", async () => {
    const detectadas = await traducir(["Limpio el piso todos los días"]);
    expect(detectadas.some((d) => d.id === "C10")).toBe(true);
  });

  it("solo coincide con palabras completas", async () => {
    const detectadas = await traducir(["posada"]);
    expect(detectadas.some((d) => d.id === "C03")).toBe(false);
  });
});

describe("sugerencias de ocupaciones", () => {
  it("con el conjunto mínimo ordena por cobertura y nombre", () => {
    const sugerencias = sugerirOcupaciones(["C01"], {
      ...datosMinimos,
      mapeo: competenciasPorOcupacion(datosMinimos.mapeo),
    });
    expect(sugerencias.map((s) => s.ocupacion.id)).toEqual(["d", "c", "a"]);
    expect(sugerencias[0]?.cobertura).toBeCloseTo(1, 6);
    expect(sugerencias[1]?.cobertura).toBeCloseTo(1, 6);
    expect(sugerencias[2]?.cobertura).toBeCloseTo(0.4, 6);
  });

  it("con datos reales devuelve como máximo 3, con cobertura positiva y en orden", async () => {
    const detectadas = await traducir(["cobro con yape y cuadro la caja al cierre"]);
    const sugerencias = sugerirOcupaciones(
      detectadas.map((d) => d.id),
      { ocupaciones, competencias, mapeo: competenciasPorOcupacion(mapeo) },
    );
    expect(sugerencias.length).toBeGreaterThan(0);
    expect(sugerencias.length).toBeLessThanOrEqual(3);
    for (const sugerencia of sugerencias) {
      expect(sugerencia.cobertura).toBeGreaterThan(0);
    }
    for (let i = 1; i < sugerencias.length; i += 1) {
      expect(sugerencias[i - 1]?.cobertura ?? 0).toBeGreaterThanOrEqual(
        sugerencias[i]?.cobertura ?? 0,
      );
    }
  });
});

function respuestaJson(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("adaptador QVAC con respaldo", () => {
  it("usa las competencias y evidencias que devuelve /api/traducir", async () => {
    const fetchFalso = vi.fn(async () =>
      respuestaJson({
        detectadas: [
          { id: "C03", evidencias: ["cobro con yape"] },
          { id: "C04", evidencias: [] },
          { id: "C99", evidencias: ["inventado"] },
        ],
        modo: "qvac",
      }),
    );
    const modos: ModoTraduccion[] = [];
    const traducir = crearTraductorQvac(competencias, {
      fetch: fetchFalso as unknown as typeof fetch,
      alResolver: (modo) => modos.push(modo),
    });

    const detectadas = await traducir(["cobro con yape y cuadro la caja al cierre"]);

    expect(fetchFalso).toHaveBeenCalledWith(
      "/api/traducir",
      expect.objectContaining({ method: "POST" }),
    );
    expect(detectadas.map((d) => d.id)).toEqual(["C03", "C04"]);
    expect(detectadas[0]?.palabrasEncontradas).toEqual(["cobro con yape"]);
    expect(detectadas[1]?.palabrasEncontradas).toEqual(["Arqueo, cuadre y cierre de caja"]);
    expect(modos).toEqual(["qvac"]);
  });

  it("activa el respaldo por palabras clave si el endpoint responde 502", async () => {
    const modos: ModoTraduccion[] = [];
    const traducir = crearTraductorQvac(competencias, {
      fetch: (async () => respuestaJson({ error: "qvac_unavailable" }, 502)) as typeof fetch,
      alResolver: (modo) => modos.push(modo),
    });
    const detectadas = await traducir(["cobro con yape y cuadro la caja al cierre"]);
    expect(detectadas.map((d) => d.id)).toEqual(expect.arrayContaining(["C03", "C04"]));
    expect(modos).toEqual(["respaldo"]);
  });

  it("activa el respaldo si fetch lanza un error de red", async () => {
    const traducir = crearTraductorQvac(competencias, {
      fetch: (async () => {
        throw new TypeError("Failed to fetch");
      }) as typeof fetch,
    });
    const detectadas = await traducir(["cobro con yape"]);
    expect(detectadas.map((d) => d.id)).toContain("C03");
  });

  it("usa el respaldo si QVAC devuelve 0 competencias y las palabras clave sí encuentran", async () => {
    const traducir = crearTraductorQvac(competencias, {
      fetch: (async () => respuestaJson({ detectadas: [], modo: "qvac" })) as typeof fetch,
    });
    const detectadas = await traducir(["cobro con yape"]);
    expect(detectadas.map((d) => d.id)).toContain("C03");
  });

  it("no llama al endpoint con relatos en blanco", async () => {
    const fetchFalso = vi.fn();
    const traducir = crearTraductorQvac(competencias, {
      fetch: fetchFalso as unknown as typeof fetch,
    });
    expect(await traducir(["", "   "])).toEqual([]);
    expect(fetchFalso).not.toHaveBeenCalled();
  });
});

describe("protocolo QVAC del servidor", () => {
  const idsValidos = new Set(competencias.map((c) => c.id));

  it("limpia cercas de markdown alrededor del JSON", () => {
    expect(limpiarContenido('```json\n{"detectadas": []}\n```')).toBe('{"detectadas": []}');
  });

  it("descarta ids fuera del catálogo, duplicados y limita a 3 evidencias", () => {
    const contenido = JSON.stringify({
      detectadas: [
        { id: "C02", evidencias: ["a", "b", "c", "d"] },
        { id: "C02", evidencias: ["x"] },
        { id: "C77", evidencias: ["inventado"] },
        { id: 5 },
      ],
    });
    expect(interpretarRespuestaQvac(contenido, idsValidos)).toEqual([
      { id: "C02", evidencias: ["a", "b", "c"] },
    ]);
  });

  it("lanza un error si la respuesta del modelo no es JSON con la estructura esperada", () => {
    expect(() => interpretarRespuestaQvac("no sé", idsValidos)).toThrow();
    expect(() => interpretarRespuestaQvac('{"otra": 1}', idsValidos)).toThrow();
  });

  it("reintenta ante 429 y devuelve el contenido del modelo", async () => {
    const fetchFalso = vi
      .fn()
      .mockResolvedValueOnce(respuestaJson({ error: { type: "rate_limit_error" } }, 429))
      .mockResolvedValueOnce(
        respuestaJson({ choices: [{ message: { content: '{"detectadas": []}' } }] }),
      );
    const config = { endpoint: "http://qvac.test", token: "t", modelo: "m" };
    const contenido = await pedirClasificacionQvac(config, "sistema", "relato", {
      fetch: fetchFalso as unknown as typeof fetch,
      esperaMs: 0,
    });
    expect(contenido).toBe('{"detectadas": []}');
    expect(fetchFalso).toHaveBeenCalledTimes(2);
    const [, init] = fetchFalso.mock.calls[1] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer t");
    expect(JSON.parse(String(init.body)).temperature).toBe(0.1);
  });

  it("se rinde tras 3 reintentos (4 intentos) si QVAC sigue caído", async () => {
    const fetchFalso = vi.fn(async () => {
      throw new TypeError("ECONNREFUSED");
    });
    const config = { endpoint: "http://qvac.test", token: "", modelo: "m" };
    await expect(
      pedirClasificacionQvac(config, "s", "r", {
        fetch: fetchFalso as unknown as typeof fetch,
        esperaMs: 0,
      }),
    ).rejects.toThrow("ECONNREFUSED");
    expect(fetchFalso).toHaveBeenCalledTimes(4);
  });
});
