import type { DatosMotor } from "../../src/lib/afinidad.ts";
import { type Curso, URL_CAPACITA_T } from "../../src/lib/esquemas.ts";

function curso(tema: string): Curso {
  return { tema, url: URL_CAPACITA_T, horasReferenciales: 4 };
}

export const datosMinimos: DatosMotor = {
  ocupaciones: [
    { id: "a", nombreCorto: "Delta" },
    { id: "b", nombreCorto: "Zeta" },
    { id: "c", nombreCorto: "Beta" },
    { id: "d", nombreCorto: "Alfa" },
  ],
  competencias: [
    {
      id: "C01",
      nombre: "Técnica uno",
      tipo: "tecnica",
      descripcionSencilla: "Competencia técnica de prueba uno.",
      palabrasClave: ["uno"],
    },
    {
      id: "C02",
      nombre: "Técnica dos",
      tipo: "tecnica",
      descripcionSencilla: "Competencia técnica de prueba dos.",
      palabrasClave: ["dos"],
    },
    {
      id: "C03",
      nombre: "Técnica tres",
      tipo: "tecnica",
      descripcionSencilla: "Competencia técnica de prueba tres.",
      palabrasClave: ["tres"],
    },
    {
      id: "C26",
      nombre: "Transversal",
      tipo: "transversal",
      descripcionSencilla: "Competencia transversal de prueba.",
      palabrasClave: ["cuatro"],
    },
  ],
  mapeo: {
    a: { C01: ["A-1-E1"], C02: ["A-1-E2"], C26: ["A-1-E1"] },
    b: { C02: ["B-1-E1"], C03: ["B-1-E2"], C26: ["B-1-E1"] },
    c: { C01: ["C-1-E1"] },
    d: { C01: ["D-1-E1"] },
  },
  cursos: {
    C01: curso("Tema uno"),
    C02: curso("Tema dos"),
    C03: curso("Tema tres"),
    C26: curso("Tema cuatro"),
  },
};
