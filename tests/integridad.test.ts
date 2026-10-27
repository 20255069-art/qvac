import { describe, expect, it } from "vitest";
import competenciasJson from "../src/data/competencias.json";
import mapeoJson from "../src/data/mapeo.json";
import ocupacionesJson from "../src/data/ocupaciones.json";
import {
  esquemaCompetencias,
  esquemaMapeo,
  esquemaOcupaciones,
  type Mapeo,
} from "../src/lib/esquemas.ts";
import { erroresDeIntegridad } from "../src/lib/integridad.ts";

const ocupaciones = esquemaOcupaciones.parse(ocupacionesJson);
const competencias = esquemaCompetencias.parse(competenciasJson);
const mapeo = esquemaMapeo.parse(mapeoJson);

const tipoPorId = new Map(competencias.map((competencia) => [competencia.id, competencia.tipo]));

function peso(id: string): number {
  return tipoPorId.get(id) === "tecnica" ? 1 : 0.5;
}

function suma(ids: Iterable<string>): number {
  let total = 0;
  for (const id of ids) {
    total += peso(id);
  }
  return total;
}

function afinidad(origen: string, destino: string): number {
  const conjuntoA = new Set(Object.keys(mapeo[origen] ?? {}));
  const conjuntoB = new Set(Object.keys(mapeo[destino] ?? {}));
  const interseccion = [...conjuntoA].filter((id) => conjuntoB.has(id));
  const union = new Set([...conjuntoA, ...conjuntoB]);
  const cobertura = suma(interseccion) / suma(conjuntoB);
  const jaccard = suma(interseccion) / suma(union);
  return (cobertura + jaccard) / 2;
}

describe("competencias.json", () => {
  it("tiene C01 a C30 en orden, con su tipo", () => {
    expect(competencias.map((competencia) => competencia.id)).toEqual(
      Array.from({ length: 30 }, (_, indice) => `C${String(indice + 1).padStart(2, "0")}`),
    );
    for (const [indice, competencia] of competencias.entries()) {
      expect(competencia.tipo).toBe(indice < 25 ? "tecnica" : "transversal");
    }
  });

  it("todas las palabras clave van en minúsculas y sin tildes", () => {
    for (const competencia of competencias) {
      for (const palabra of competencia.palabrasClave) {
        expect(palabra).toMatch(/^[a-z]+( [a-z]+)*$/);
      }
    }
  });
});

describe("mapeo.json", () => {
  it("no tiene errores de integridad", () => {
    expect(erroresDeIntegridad({ ocupaciones, competencias, mapeo })).toEqual([]);
  });

  it.each(ocupaciones.map((ocupacion) => ocupacion.id))(
    "%s tiene entre 6 y 16 competencias y al menos 4 técnicas",
    (id) => {
      const ids = Object.keys(mapeo[id] ?? {});
      expect(ids.length).toBeGreaterThanOrEqual(6);
      expect(ids.length).toBeLessThanOrEqual(16);
      expect(
        ids.filter((idCompetencia) => tipoPorId.get(idCompetencia) === "tecnica").length,
      ).toBeGreaterThanOrEqual(4);
    },
  );

  it("detecta un id de elemento inexistente", () => {
    const copia: Mapeo = structuredClone(mapeo);
    const primera = Object.keys(copia.almacen ?? {})[0] as string;
    copia.almacen?.[primera]?.push("H2452001-99-E99");
    const errores = erroresDeIntegridad({ ocupaciones, competencias, mapeo: copia });
    expect(errores.some((error) => error.includes("H2452001-99-E99"))).toBe(true);
  });

  it("la afinidad tiene sentido con los datos reales", () => {
    expect(afinidad("caja_comercial", "caja_financiera")).toBeGreaterThan(
      afinidad("caja_comercial", "lavanderia"),
    );
    expect(afinidad("limpieza", "housekeeping")).toBeGreaterThan(
      afinidad("limpieza", "atencion_telefonica"),
    );
  });
});
