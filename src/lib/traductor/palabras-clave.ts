import type { Competencia } from "../esquemas.ts";
import type { CompetenciaDetectada, TraductorCompetencias } from "./tipos.ts";

export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function expresionPara(palabraClave: string): RegExp {
  const escapada = palabraClave.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s+");
  return new RegExp(`\\b${escapada}\\b`);
}

export function crearTraductorPalabrasClave(
  competencias: Pick<Competencia, "id" | "nombre" | "tipo" | "palabrasClave">[],
): TraductorCompetencias {
  const reglas = competencias.map((competencia) => ({
    competencia,
    expresiones: competencia.palabrasClave.map((palabra) => ({
      palabra,
      expresion: expresionPara(palabra),
    })),
  }));

  return async (relatos) => {
    const texto = normalizar(relatos.join("\n"));
    if (texto.trim().length === 0) {
      return [];
    }
    const detectadas: CompetenciaDetectada[] = [];
    for (const { competencia, expresiones } of reglas) {
      const palabrasEncontradas = expresiones
        .filter(({ expresion }) => expresion.test(texto))
        .map(({ palabra }) => palabra);
      if (palabrasEncontradas.length > 0) {
        detectadas.push({
          id: competencia.id,
          nombre: competencia.nombre,
          tipo: competencia.tipo,
          palabrasEncontradas,
        });
      }
    }
    return detectadas.sort((x, y) => x.id.localeCompare(y.id));
  };
}
