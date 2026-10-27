import type { Competencia } from "../esquemas.ts";

export type CompetenciaDetectada = {
  id: string;
  nombre: string;
  tipo: Competencia["tipo"];
  palabrasEncontradas: string[];
};

/** Contrato estable: hoy lo implementa palabras-clave.ts; en la versión final, un adaptador de QVAC. */
export type TraductorCompetencias = (relatos: string[]) => Promise<CompetenciaDetectada[]>;
