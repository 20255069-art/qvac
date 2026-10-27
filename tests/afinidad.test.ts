import { describe, expect, it } from "vitest";
import { calcularTransicion, crearMotor, ranking } from "../src/lib/afinidad.ts";
import { mapeo, ocupaciones } from "../src/lib/datos.ts";
import { datosMinimos } from "./fixtures/datos-minimos.ts";

const motorMinimo = crearMotor(datosMinimos);

function ids(lista: { competencia: { id: string } }[]): string[] {
  return lista.map((elemento) => elemento.competencia.id);
}

describe("afinidad con el conjunto mínimo (calculado a mano)", () => {
  it("a → b", () => {
    const t = motorMinimo.calcularTransicion("a", "b");
    expect(t.cobertura).toBeCloseTo(0.6, 6);
    expect(t.jaccard).toBeCloseTo(0.428571, 6);
    expect(t.afinidad).toBe(0.514);
    expect(ids(t.compartidas)).toEqual(["C02", "C26"]);
    expect(ids(t.porFortalecer)).toEqual(["C03"]);
    expect(t.porFortalecer[0]?.curso.tema).toBe("Tema tres");
    const c02 = t.compartidas[0];
    expect(c02?.evidenciaOrigen).toEqual(["A-1-E2"]);
    expect(c02?.evidenciaDestino).toEqual(["B-1-E1"]);
  });

  it("a → c", () => {
    const t = motorMinimo.calcularTransicion("a", "c");
    expect(t.cobertura).toBeCloseTo(1, 6);
    expect(t.jaccard).toBeCloseTo(0.4, 6);
    expect(t.afinidad).toBe(0.7);
    expect(ids(t.compartidas)).toEqual(["C01"]);
    expect(ids(t.porFortalecer)).toEqual([]);
  });

  it("c → a", () => {
    const t = motorMinimo.calcularTransicion("c", "a");
    expect(t.cobertura).toBeCloseTo(0.4, 6);
    expect(t.jaccard).toBeCloseTo(0.4, 6);
    expect(t.afinidad).toBe(0.4);
    expect(ids(t.compartidas)).toEqual(["C01"]);
    expect(ids(t.porFortalecer)).toEqual(["C02", "C26"]);
  });

  it("el ranking de a desempata por nombre corto", () => {
    expect(motorMinimo.ranking("a").map((t) => t.destino)).toEqual(["d", "c", "b"]);
  });
});

describe("afinidad con los datos reales", () => {
  const pares = ocupaciones.flatMap((origen) =>
    ocupaciones
      .filter((destino) => destino.id !== origen.id)
      .map((destino) => [origen.id, destino.id] as const),
  );

  it("recorre los 72 pares ordenados", () => {
    expect(pares).toHaveLength(72);
  });

  it.each(pares)("%s → %s es coherente con mapeo.json", (origen, destino) => {
    const t = calcularTransicion(origen, destino);
    const unidos = [...ids(t.compartidas), ...ids(t.porFortalecer)];
    expect([...unidos].sort()).toEqual(Object.keys(mapeo[destino] ?? {}).sort());
    expect(new Set(unidos).size).toBe(unidos.length);
    for (const valor of [t.afinidad, t.cobertura, t.jaccard]) {
      expect(valor).toBeGreaterThanOrEqual(0);
      expect(valor).toBeLessThanOrEqual(1);
    }
  });

  it.each(ocupaciones.map((o) => o.id))("ranking de %s", (id) => {
    const lista = ranking(id);
    expect(lista).toHaveLength(8);
    expect(lista.some((t) => t.destino === id)).toBe(false);
    for (let i = 1; i < lista.length; i += 1) {
      expect((lista[i - 1]?.afinidad ?? 0) >= (lista[i]?.afinidad ?? 0)).toBe(true);
    }
  });

  it("rechaza origen igual a destino y ocupaciones desconocidas", () => {
    expect(() => calcularTransicion("caja_comercial", "caja_comercial")).toThrow(
      "origen y destino deben ser distintos",
    );
    expect(() => calcularTransicion("caja_comercial", "no_existe")).toThrow(
      "ocupación desconocida: no_existe",
    );
  });
});
