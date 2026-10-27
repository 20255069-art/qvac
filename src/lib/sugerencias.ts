import type { Competencia, Mapeo } from "./esquemas.ts";
import { type OcupacionMotor, peso } from "./pesos.ts";

export type DatosSugerencia = {
  ocupaciones: OcupacionMotor[];
  competencias: Pick<Competencia, "id" | "tipo">[];
  mapeo: Mapeo;
};

export type Sugerencia = { ocupacion: OcupacionMotor; cobertura: number };

export function sugerirOcupaciones(
  detectadas: string[],
  datos: DatosSugerencia,
  maximo = 3,
): Sugerencia[] {
  const tipoPorId = new Map(
    datos.competencias.map((competencia) => [competencia.id, competencia.tipo]),
  );
  const pesoDe = (id: string): number => {
    const tipo = tipoPorId.get(id);
    return tipo === undefined ? 0 : peso(tipo);
  };
  const conjuntoDetectado = new Set(detectadas);
  return datos.ocupaciones
    .map((ocupacion) => {
      const ids = Object.keys(datos.mapeo[ocupacion.id] ?? {});
      const total = ids.reduce((suma, id) => suma + pesoDe(id), 0);
      const cubierto = ids
        .filter((id) => conjuntoDetectado.has(id))
        .reduce((suma, id) => suma + pesoDe(id), 0);
      return { ocupacion, cobertura: total === 0 ? 0 : cubierto / total };
    })
    .filter((sugerencia) => sugerencia.cobertura > 0)
    .sort(
      (x, y) =>
        y.cobertura - x.cobertura ||
        x.ocupacion.nombreCorto.localeCompare(y.ocupacion.nombreCorto, "es"),
    )
    .slice(0, maximo);
}
