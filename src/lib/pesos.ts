import type { Competencia } from "./esquemas.ts";

export type OcupacionMotor = { id: string; nombreCorto: string };

export function peso(tipo: Competencia["tipo"]): number {
  return tipo === "tecnica" ? 1 : 0.5;
}
