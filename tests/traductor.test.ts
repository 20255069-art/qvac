import { describe, expect, it } from "vitest";
import { competencias, mapeo, ocupaciones } from "../src/lib/datos.ts";
import { competenciasPorOcupacion, sugerirOcupaciones } from "../src/lib/sugerencias.ts";
import { crearTraductorPalabrasClave } from "../src/lib/traductor/palabras-clave.ts";
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
