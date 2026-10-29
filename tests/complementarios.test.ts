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
import { generarCodigoVerificacionQvac, sanitizarRelatoCiudadano } from "../src/lib/privacidad.ts";

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

describe("privacidad QVAC (escudo anti-PII y código determinista)", () => {
  it("detecta y redacta DNI, celular y correo electrónico en memoria", () => {
    const resultado = sanitizarRelatoCiudadano(
      "Mi DNI es 45891234, mi celular es 987654321 y mi correo es trabajador@correo.pe",
    );
    expect(resultado.datosProtegidos).toBeGreaterThanOrEqual(3);
    expect(resultado.tiposDetectados).toContain("DNI");
    expect(resultado.tiposDetectados).toContain("celular");
    expect(resultado.tiposDetectados).toContain("correo electrónico");
    expect(resultado.textoSanitizado).toContain("[DNI_PROTEGIDO]");
    expect(resultado.textoSanitizado).toContain("[CELULAR_PROTEGIDO]");
  });

  it("genera un código de verificación determinista MTPE-QVAC-2026", () => {
    const codigo1 = generarCodigoVerificacionQvac(["C03", "C04"], "Lima");
    const codigo2 = generarCodigoVerificacionQvac(["C04", "C03"], "Lima");
    expect(codigo1).toMatch(/^MTPE-QVAC-2026-[0-9A-F]{8}$/);
    expect(codigo1).toBe(codigo2);
  });
});
