import type { Competencia, Mapeo, Ocupacion } from "./esquemas.ts";

export type DatosIntegridad = {
  ocupaciones: Ocupacion[];
  competencias: Competencia[];
  mapeo: Mapeo;
};

export function erroresDeIntegridad(datos: DatosIntegridad): string[] {
  const errores: string[] = [];
  const tipoPorId = new Map(
    datos.competencias.map((competencia) => [competencia.id, competencia.tipo]),
  );
  const idsOcupaciones = new Set<string>(datos.ocupaciones.map((ocupacion) => ocupacion.id));

  for (const idMapeo of Object.keys(datos.mapeo)) {
    if (!idsOcupaciones.has(idMapeo)) {
      errores.push(`mapeo con ocupación desconocida: ${idMapeo}`);
    }
  }

  for (const ocupacion of datos.ocupaciones) {
    const entrada = datos.mapeo[ocupacion.id];
    if (entrada === undefined) {
      errores.push(`${ocupacion.id}: no tiene entrada en mapeo.json`);
      continue;
    }
    const elementosOperativos = new Set(
      ocupacion.estandares
        .filter((estandar) => estandar.rol === "operativo")
        .flatMap((estandar) => estandar.elementos.map((elemento) => elemento.id)),
    );
    const idsCompetencias = Object.keys(entrada);
    if (idsCompetencias.length < 6 || idsCompetencias.length > 16) {
      errores.push(
        `${ocupacion.id}: tiene ${idsCompetencias.length} competencias (debe tener entre 6 y 16)`,
      );
    }
    const tecnicas = idsCompetencias.filter((id) => tipoPorId.get(id) === "tecnica").length;
    if (tecnicas < 4) {
      errores.push(`${ocupacion.id}: tiene ${tecnicas} competencias técnicas (mínimo 4)`);
    }
    for (const [idCompetencia, evidencias] of Object.entries(entrada)) {
      if (!tipoPorId.has(idCompetencia)) {
        errores.push(`${ocupacion.id}: competencia desconocida ${idCompetencia}`);
      }
      for (const idElemento of evidencias) {
        if (!elementosOperativos.has(idElemento)) {
          errores.push(
            `${ocupacion.id}/${idCompetencia}: el elemento ${idElemento} no existe entre sus estándares operativos`,
          );
        }
      }
    }
  }
  return errores;
}
