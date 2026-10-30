import { useState } from "react";
import type { Competencia } from "../../lib/esquemas.ts";
import { formatearPorcentaje } from "../../lib/formato.ts";
import type { Sugerencia } from "../../lib/sugerencias.ts";
import type { CompetenciaDetectada } from "../../lib/traductor/tipos.ts";

type CursoInfo = {
  tema: string;
  url: string;
  horasReferenciales: number;
};

type Props = {
  detectadas: CompetenciaDetectada[];
  sugerencias: Sugerencia[];
  todasCompetencias: Pick<Competencia, "id" | "nombre" | "tipo">[];
  mapeo: Record<string, string[]>;
  cursos?: Record<string, CursoInfo>;
};

// Cursos de respaldo si no se pasan por props (datos oficiales Capacíta-T)
const CURSOS_FALLBACK: Record<string, CursoInfo> = {
  C01: {
    tema: "Atención al cliente",
    url: "https://capacitacionlaboral.trabajo.gob.pe/",
    horasReferenciales: 8,
  },
  C02: {
    tema: "Manejo de efectivo",
    url: "https://capacitacionlaboral.trabajo.gob.pe/",
    horasReferenciales: 4,
  },
  C03: {
    tema: "Medios de pago digitales",
    url: "https://capacitacionlaboral.trabajo.gob.pe/",
    horasReferenciales: 4,
  },
  C04: {
    tema: "Cierre y cuadre de caja",
    url: "https://capacitacionlaboral.trabajo.gob.pe/",
    horasReferenciales: 4,
  },
  C05: {
    tema: "Ofimática básica",
    url: "https://capacitacionlaboral.trabajo.gob.pe/",
    horasReferenciales: 10,
  },
  C06: {
    tema: "Comprobantes de pago",
    url: "https://capacitacionlaboral.trabajo.gob.pe/",
    horasReferenciales: 4,
  },
  C07: {
    tema: "Control de inventarios",
    url: "https://capacitacionlaboral.trabajo.gob.pe/",
    horasReferenciales: 6,
  },
  C08: {
    tema: "Gestión de almacenes",
    url: "https://capacitacionlaboral.trabajo.gob.pe/",
    horasReferenciales: 8,
  },
  C09: {
    tema: "Metodología 5S",
    url: "https://capacitacionlaboral.trabajo.gob.pe/",
    horasReferenciales: 4,
  },
  C10: {
    tema: "Limpieza y desinfección",
    url: "https://capacitacionlaboral.trabajo.gob.pe/",
    horasReferenciales: 6,
  },
};

export default function ArbolHabilidades({
  detectadas,
  sugerencias,
  todasCompetencias,
  mapeo,
  cursos = CURSOS_FALLBACK,
}: Props) {
  const [indiceOcupacion, setIndiceOcupacion] = useState(0);

  const sugerenciaActual = sugerencias[indiceOcupacion] ?? sugerencias[0];
  if (!sugerenciaActual) return null;

  const ocupacionId = sugerenciaActual.ocupacion.id;
  const idsRequeridos = mapeo[ocupacionId] ?? [];
  const conjuntoDetectadas = new Set(detectadas.map((d) => d.id));

  // Mapa de nombres por ID
  const nombrePorId = new Map(todasCompetencias.map((c) => [c.id, c.nombre]));

  // Competencias dominadas en esta ocupación
  const dominadasEnRuta = idsRequeridos.filter((id) => conjuntoDetectadas.has(id));
  // Brechas por desbloquear en esta ocupación
  const brechasEnRuta = idsRequeridos.filter((id) => !conjuntoDetectadas.has(id));

  // Otras competencias que el usuario domina fuera de la ocupación activa
  const otrasDominadas = detectadas.filter((d) => !idsRequeridos.includes(d.id));

  const porcentajeMatch = Math.round(sugerenciaActual.cobertura * 100);

  return (
    <div className="space-y-6">
      {/* Selector de Ruta Ocupacional Gamificada */}
      <div>
        <h3 className="text-xs font-bold text-texto-suave mb-2 uppercase tracking-wide">
          Ocupaciones sugeridas según tu afinidad:
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {sugerencias.map((sug, idx) => (
            <div
              key={sug.ocupacion.id}
              className={`rounded border p-3 transition-all ${
                idx === indiceOcupacion
                  ? "border-[#004884] bg-sky-50/70 ring-1 ring-[#004884]"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <a
                  href={`/ocupaciones/${sug.ocupacion.id}/`}
                  className="font-bold text-[#004884] hover:underline text-sm leading-tight"
                >
                  {sug.ocupacion.nombreCorto}
                </a>
                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-black text-emerald-800 whitespace-nowrap">
                  {formatearPorcentaje(sug.cobertura * 100, 0)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIndiceOcupacion(idx)}
                className={`mt-2 w-full rounded px-2 py-1 text-xs font-semibold border transition ${
                  idx === indiceOcupacion
                    ? "bg-[#004884] text-white border-[#004884]"
                    : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
              >
                {idx === indiceOcupacion ? "● Ruta seleccionada" : "Ver árbol de competencias"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Contenedor Principal del Árbol RPG */}
      <div className="rounded border border-gray-200 bg-gray-50/40 p-5 shadow-2xs">
        {/* Barra de Nivel de Compatibilidad RPG */}
        <div className="mb-6 rounded bg-white p-4 border border-gray-200 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="inline-block rounded bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-800 uppercase tracking-wide">
                Nivel de Afinidad Laboral
              </span>
              <h3 className="mt-1 text-base sm:text-lg font-bold text-gray-900">
                Ruta hacia:{" "}
                <span className="text-[#004884]">{sugerenciaActual.ocupacion.nombreCorto}</span>
              </h3>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-emerald-800">{porcentajeMatch}%</span>
              <p className="text-xs text-gray-500 font-medium">Competencias cubiertas</p>
            </div>
          </div>

          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full bg-emerald-600 transition-all duration-700 ease-out"
              style={{ width: `${Math.max(10, porcentajeMatch)}%` }}
            />
          </div>
        </div>

        {/* Layout Visual del Árbol de Habilidades */}
        <div className="relative">
          {/* Nodo Central: Perfil del Trabajador */}
          <div className="mx-auto mb-8 max-w-sm rounded border-2 border-[#004884] bg-white p-4 text-center shadow-xs">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-[#004884]">
              <svg
                aria-hidden="true"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#004884]">
              Nodo Central
            </span>
            <h4 className="text-base font-bold text-texto">Tu Perfil de Experiencia Empírica</h4>
            <p className="mt-1 text-xs text-texto-suave">
              {detectadas.length} competencia(s) reconocida(s) en tu relato
            </p>
          </div>

          {/* Conectores y Ramas */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Rama Verde: Habilidades Desbloqueadas */}
            <div className="rounded-md border border-emerald-300 bg-emerald-50/60 p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between border-b border-emerald-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white shadow-sm">
                    ✓
                  </span>
                  <h4 className="font-bold text-emerald-950">
                    Habilidades Desbloqueadas ({dominadasEnRuta.length + otrasDominadas.length})
                  </h4>
                </div>
                <span className="rounded bg-emerald-200/80 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                  Ya lo tienes
                </span>
              </div>

              <div className="space-y-2.5">
                {dominadasEnRuta.map((id) => {
                  const detectada = detectadas.find((d) => d.id === id);
                  const nombre = nombrePorId.get(id) ?? detectada?.nombre ?? id;
                  return (
                    <div
                      key={id}
                      className="group flex flex-col rounded-md border border-emerald-200 bg-white p-3 shadow-xs transition hover:border-emerald-400 hover:shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-600 font-bold">●</span>
                        <span className="font-semibold text-emerald-900 text-sm sm:text-base">
                          {nombre}
                        </span>
                      </div>
                      {detectada?.palabrasEncontradas &&
                        detectada.palabrasEncontradas.length > 0 && (
                          <p className="mt-1 text-xs text-emerald-700 italic pl-4">
                            Evidencia del relato: "
                            {detectada.palabrasEncontradas.slice(0, 2).join('", "')}"
                          </p>
                        )}
                    </div>
                  );
                })}

                {/* Otras competencias demostradas */}
                {otrasDominadas.map((d) => (
                  <div
                    key={d.id}
                    className="flex flex-col rounded-md border border-emerald-100 bg-white/80 p-2.5 pl-3 text-sm text-emerald-800"
                  >
                    <span className="font-medium text-xs text-emerald-600 uppercase">
                      Transferible adicional:
                    </span>
                    <span className="font-semibold">
                      {nombrePorId.get(d.id) ?? d.nombre ?? d.id}
                    </span>
                  </div>
                ))}

                {dominadasEnRuta.length === 0 && otrasDominadas.length === 0 && (
                  <p className="text-xs text-texto-suave">
                    Aún no se detectaron competencias directas en esta rama.
                  </p>
                )}
              </div>
            </div>

            {/* Rama Gris / Candados: Habilidades por Fortalecer */}
            <div className="rounded-md border border-gray-300 bg-gray-50/70 p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between border-b border-gray-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-500 text-xs font-bold text-white shadow-sm">
                    🔒
                  </span>
                  <h4 className="font-bold text-gray-800">
                    Brechas por Desbloquear ({brechasEnRuta.length})
                  </h4>
                </div>
                <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                  Por fortalecer
                </span>
              </div>

              <div className="space-y-2.5">
                {brechasEnRuta.map((id) => {
                  const nombre = nombrePorId.get(id) ?? id;
                  const curso = cursos[id];
                  return (
                    <div
                      key={id}
                      className="rounded-md border border-gray-200 bg-white p-3 shadow-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 font-bold">🔒</span>
                          <span className="font-semibold text-gray-800 text-sm sm:text-base">
                            {nombre}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-por-fortalecer-texto bg-amber-50 px-1.5 py-0.5 rounded">
                          Bloqueada
                        </span>
                      </div>

                      {curso && (
                        <div className="mt-2 rounded bg-amber-50/60 p-2 text-xs border border-amber-200/50">
                          <p className="font-semibold text-amber-900">
                            Micro-curso sugerido (Capacíta-T MTPE):
                          </p>
                          <div className="mt-1 flex flex-wrap items-center justify-between gap-1">
                            <span className="text-gray-700">
                              {curso.tema} • {curso.horasReferenciales} hrs
                            </span>
                            <a
                              href={curso.url}
                              target="_blank"
                              rel="noreferrer"
                              className="font-bold text-primario hover:underline inline-flex items-center gap-0.5"
                            >
                              Ver curso gratuito ↗
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {brechasEnRuta.length === 0 && (
                  <p className="text-xs text-emerald-800 font-semibold p-3 bg-emerald-50 rounded">
                    ¡Felicitaciones! Has desbloqueado el 100% de competencias requeridas para este
                    puesto.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
