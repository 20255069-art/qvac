import competenciasJson from "../data/competencias.json";
import contextoJson from "../data/contexto.json";
import cursosJson from "../data/cursos.json";
import mapeoJson from "../data/mapeo.json";
import ocupacionesJson from "../data/ocupaciones.json";
import {
  esquemaCompetencias,
  esquemaContexto,
  esquemaCursos,
  esquemaMapeo,
  esquemaOcupaciones,
  type Ocupacion,
} from "./esquemas.ts";
import { erroresDeIntegridad } from "./integridad.ts";

export const ocupaciones = esquemaOcupaciones.parse(ocupacionesJson);
export const competencias = esquemaCompetencias.parse(competenciasJson);
export const mapeo = esquemaMapeo.parse(mapeoJson);
export const cursos = esquemaCursos.parse(cursosJson);
export const contexto = esquemaContexto.parse(contextoJson);

const errores = erroresDeIntegridad({ ocupaciones, competencias, mapeo });
for (const competencia of competencias) {
  if (cursos[competencia.id] === undefined) {
    errores.push(`cursos.json no tiene curso para ${competencia.id}`);
  }
}
if (errores.length > 0) {
  throw new Error(`Datos inconsistentes:\n${errores.join("\n")}`);
}

export function ocupacionPorId(id: string): Ocupacion {
  const ocupacion = ocupaciones.find((candidata) => candidata.id === id);
  if (ocupacion === undefined) {
    throw new Error(`ocupación desconocida: ${id}`);
  }
  return ocupacion;
}
