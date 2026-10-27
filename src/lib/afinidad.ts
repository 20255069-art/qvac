import { competencias, cursos, mapeo, ocupaciones } from "./datos.ts";
import type { Competencia, Curso, Cursos, Mapeo } from "./esquemas.ts";
import { type OcupacionMotor, peso } from "./pesos.ts";

export type DatosMotor = {
  ocupaciones: OcupacionMotor[];
  competencias: Competencia[];
  mapeo: Mapeo;
  cursos: Cursos;
};

export type Compartida = {
  competencia: Competencia;
  evidenciaOrigen: string[];
  evidenciaDestino: string[];
};

export type PorFortalecer = {
  competencia: Competencia;
  evidenciaDestino: string[];
  curso: Curso;
};

export type Transicion = {
  origen: string;
  destino: string;
  afinidad: number;
  cobertura: number;
  jaccard: number;
  compartidas: Compartida[];
  porFortalecer: PorFortalecer[];
};

export function crearMotor(datos: DatosMotor) {
  const competenciaPorId = new Map(
    datos.competencias.map((competencia) => [competencia.id, competencia]),
  );
  const nombrePorId = new Map(
    datos.ocupaciones.map((ocupacion) => [ocupacion.id, ocupacion.nombreCorto]),
  );

  function conjunto(idOcupacion: string): Record<string, string[]> {
    const entrada = datos.mapeo[idOcupacion];
    if (!nombrePorId.has(idOcupacion) || entrada === undefined) {
      throw new Error(`ocupación desconocida: ${idOcupacion}`);
    }
    return entrada;
  }

  function competencia(id: string): Competencia {
    const encontrada = competenciaPorId.get(id);
    if (encontrada === undefined) {
      throw new Error(`competencia desconocida: ${id}`);
    }
    return encontrada;
  }

  function sumaPesos(ids: Iterable<string>): number {
    let total = 0;
    for (const id of ids) {
      total += peso(competencia(id).tipo);
    }
    return total;
  }

  function calcularTransicion(origen: string, destino: string): Transicion {
    if (origen === destino) {
      throw new Error("origen y destino deben ser distintos");
    }
    const sa = conjunto(origen);
    const sb = conjunto(destino);
    const idsA = new Set(Object.keys(sa));
    const idsB = Object.keys(sb).sort();
    const idsCompartidas = idsB.filter((id) => idsA.has(id));
    const idsPorFortalecer = idsB.filter((id) => !idsA.has(id));
    const pesoInterseccion = sumaPesos(idsCompartidas);
    const pesoDestino = sumaPesos(idsB);
    const pesoUnion = sumaPesos(new Set([...idsA, ...idsB]));
    const cobertura = pesoDestino === 0 ? 0 : pesoInterseccion / pesoDestino;
    const jaccard = pesoUnion === 0 ? 0 : pesoInterseccion / pesoUnion;
    return {
      origen,
      destino,
      afinidad: Math.round(((cobertura + jaccard) / 2) * 1000) / 1000,
      cobertura,
      jaccard,
      compartidas: idsCompartidas.map((id) => ({
        competencia: competencia(id),
        evidenciaOrigen: sa[id] ?? [],
        evidenciaDestino: sb[id] ?? [],
      })),
      porFortalecer: idsPorFortalecer.map((id) => {
        const curso = datos.cursos[id];
        if (curso === undefined) {
          throw new Error(`sin curso para ${id}`);
        }
        return { competencia: competencia(id), evidenciaDestino: sb[id] ?? [], curso };
      }),
    };
  }

  function ranking(origen: string): Transicion[] {
    conjunto(origen);
    return datos.ocupaciones
      .filter((ocupacion) => ocupacion.id !== origen)
      .map((ocupacion) => calcularTransicion(origen, ocupacion.id))
      .sort(
        (x, y) =>
          y.afinidad - x.afinidad ||
          y.cobertura - x.cobertura ||
          (nombrePorId.get(x.destino) ?? "").localeCompare(nombrePorId.get(y.destino) ?? "", "es"),
      );
  }

  return { calcularTransicion, ranking };
}

const motor = crearMotor({ ocupaciones, competencias, mapeo, cursos });

export const calcularTransicion = motor.calcularTransicion;
export const ranking = motor.ranking;
