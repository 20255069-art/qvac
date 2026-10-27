import { describe, expect, it } from "vitest";
import competenciasJson from "../src/data/competencias.json";
import contextoJson from "../src/data/contexto.json";
import cursosJson from "../src/data/cursos.json";
import {
  esquemaCompetencias,
  esquemaContexto,
  esquemaCurso,
  esquemaCursos,
  URL_CAPACITA_T,
} from "../src/lib/esquemas.ts";

const competencias = esquemaCompetencias.parse(competenciasJson);

describe("cursos.json", () => {
  const cursos = esquemaCursos.parse(cursosJson);

  it("tiene exactamente una entrada por competencia", () => {
    expect(Object.keys(cursos).sort()).toEqual(
      competencias.map((competencia) => competencia.id).sort(),
    );
  });

  it("todas apuntan al portal Capacíta-T con horas referenciales válidas", () => {
    for (const curso of Object.values(cursos)) {
      expect(curso.url).toBe(URL_CAPACITA_T);
      expect(Number.isInteger(curso.horasReferenciales)).toBe(true);
      expect(curso.horasReferenciales).toBeGreaterThanOrEqual(4);
      expect(curso.horasReferenciales).toBeLessThanOrEqual(10);
    }
  });
});

describe("contexto.json", () => {
  it("cumple el esquema y trae los valores de informalidad", () => {
    const contexto = esquemaContexto.parse(contextoJson);
    expect(contexto.informalidadNacional).toBe(69.8);
    expect(contexto.anterior).toBe(70.7);
    expect(contexto.periodo).toBe("abril 2025 – marzo 2026");
  });
});

describe("esquemaCurso", () => {
  it("rechaza más de 10 horas", () => {
    expect(
      esquemaCurso.safeParse({ tema: "Prueba", url: URL_CAPACITA_T, horasReferenciales: 12 })
        .success,
    ).toBe(false);
  });

  it("rechaza una url distinta del portal", () => {
    expect(
      esquemaCurso.safeParse({
        tema: "Prueba",
        url: "https://ejemplo.pe/curso",
        horasReferenciales: 4,
      }).success,
    ).toBe(false);
  });
});
