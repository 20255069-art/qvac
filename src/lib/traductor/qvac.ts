import type { Competencia } from "../esquemas.ts";
import { crearTraductorPalabrasClave } from "./palabras-clave.ts";
import type { CompetenciaDetectada, TraductorCompetencias } from "./tipos.ts";

export type CompetenciaMinima = Pick<Competencia, "id" | "nombre" | "tipo" | "palabrasClave">;

/** Qué motor produjo el último resultado: útil para mostrarlo con honestidad en la interfaz. */
export type ModoTraduccion = "qvac" | "respaldo";

export type OpcionesTraductorQvac = {
  endpoint?: string;
  fetch?: typeof fetch;
  timeoutMs?: number;
  alResolver?: (modo: ModoTraduccion) => void;
};

type DetectadaRemota = { id?: unknown; evidencias?: unknown };

function aDetectadas(
  remotas: DetectadaRemota[],
  porId: Map<string, CompetenciaMinima>,
): CompetenciaDetectada[] {
  const detectadas: CompetenciaDetectada[] = [];
  for (const remota of remotas) {
    const competencia = typeof remota.id === "string" ? porId.get(remota.id) : undefined;
    if (competencia === undefined || detectadas.some((d) => d.id === competencia.id)) {
      continue;
    }
    const evidencias = Array.isArray(remota.evidencias)
      ? remota.evidencias.filter((e): e is string => typeof e === "string" && e.trim() !== "")
      : [];
    detectadas.push({
      id: competencia.id,
      nombre: competencia.nombre,
      tipo: competencia.tipo,
      palabrasEncontradas: evidencias.length > 0 ? evidencias : [competencia.nombre],
    });
  }
  return detectadas.sort((x, y) => x.id.localeCompare(y.id));
}

/**
 * Adaptador QVAC con la misma firma que el traductor por palabras clave. Pide la clasificación
 * a /api/traducir y, si falla (red, status ≠ 200, respuesta inválida) o devuelve 0 competencias
 * cuando las palabras clave sí encuentran coincidencias, usa el traductor local como respaldo.
 */
export function crearTraductorQvac(
  competencias: CompetenciaMinima[],
  {
    endpoint = "/api/traducir",
    fetch: hacerFetch,
    timeoutMs = 25000,
    alResolver,
  }: OpcionesTraductorQvac = {},
): TraductorCompetencias {
  const respaldo = crearTraductorPalabrasClave(competencias);
  const porId = new Map(competencias.map((competencia) => [competencia.id, competencia]));

  return async (relatos) => {
    if (relatos.every((relato) => relato.trim() === "")) {
      return [];
    }

    const usarRespaldo = async (): Promise<CompetenciaDetectada[]> => {
      alResolver?.("respaldo");
      return respaldo(relatos);
    };

    try {
      const respuesta = await (hacerFetch ?? fetch)(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ relatos }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!respuesta.ok) {
        return usarRespaldo();
      }
      const cuerpo = (await respuesta.json()) as { detectadas?: unknown };
      if (!Array.isArray(cuerpo.detectadas)) {
        return usarRespaldo();
      }
      const detectadas = aDetectadas(cuerpo.detectadas as DetectadaRemota[], porId);
      if (detectadas.length === 0) {
        const locales = await respaldo(relatos);
        if (locales.length > 0) {
          alResolver?.("respaldo");
          return locales;
        }
      }
      alResolver?.("qvac");
      return detectadas;
    } catch {
      return usarRespaldo();
    }
  };
}
