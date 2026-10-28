import { type FormEvent, useEffect, useMemo, useState } from "react";
import type { Competencia } from "../../lib/esquemas.ts";
import { formatearPorcentaje } from "../../lib/formato.ts";
import type { OcupacionMotor } from "../../lib/pesos.ts";
import { type Sugerencia, sugerirOcupaciones } from "../../lib/sugerencias.ts";
import { crearTraductorPalabrasClave } from "../../lib/traductor/palabras-clave.ts";
import type { CompetenciaDetectada } from "../../lib/traductor/tipos.ts";

type Props = {
  ocupaciones: OcupacionMotor[];
  competencias: Pick<Competencia, "id" | "nombre" | "tipo" | "palabrasClave">[];
  mapeo: Record<string, string[]>;
};

type Resultado = { detectadas: CompetenciaDetectada[]; sugerencias: Sugerencia[] };

const PREGUNTAS = [
  "Cuéntanos un día normal en tu trabajo: ¿qué haces desde que llegas?",
  "Recuerda una vez que resolviste un problema en el trabajo. ¿Qué pasó y qué hiciste?",
  "¿Qué es lo que mejor sabes hacer y por qué te lo reconocen?",
];

const MINIMO_CARACTERES = 15;

export default function Entrevista({ ocupaciones, competencias, mapeo }: Props) {
  const traductor = useMemo(() => crearTraductorPalabrasClave(competencias), [competencias]);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  // El botón sale deshabilitado en el HTML del servidor: sin JavaScript (o antes de hidratar)
  // el formulario no puede enviarse por GET y las respuestas nunca llegan a la URL.
  const [hidratado, setHidratado] = useState(false);

  useEffect(() => {
    setHidratado(true);
  }, []);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    const respuestas = PREGUNTAS.map((_, indice) => String(datos.get(`respuesta-${indice}`) ?? ""));

    if (!respuestas.some((respuesta) => respuesta.trim().length >= MINIMO_CARACTERES)) {
      setResultado(null);
      setError("Escribe al menos 15 caracteres en alguna de las respuestas.");
      return;
    }

    setError(null);
    const detectadas = await traductor(respuestas);
    const sugerencias = sugerirOcupaciones(
      detectadas.map((detectada) => detectada.id),
      { ocupaciones, competencias, mapeo },
    );
    setResultado({ detectadas, sugerencias });
  }

  return (
    <div>
      <form onSubmit={enviar} className="caja space-y-4">
        {PREGUNTAS.map((pregunta, indice) => (
          <div key={pregunta}>
            <label htmlFor={`respuesta-${indice}`} className="block font-semibold">
              {pregunta}
            </label>
            <textarea
              id={`respuesta-${indice}`}
              name={`respuesta-${indice}`}
              rows={4}
              className="mt-1 w-full rounded-base border border-borde p-2"
            />
          </div>
        ))}
        <button
          type="submit"
          disabled={!hidratado}
          className="min-h-12 w-full rounded-base bg-primario px-6 font-semibold text-fondo hover:bg-primario-oscuro disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          Ver mis competencias
        </button>
      </form>

      <div className="caja mt-4 space-y-1 text-base text-texto-suave">
        <p>
          Traducción simulada por palabras clave. La integración con QVAC (IA local de Tether) está
          prevista y aún no ha sido validada.
        </p>
        <p>Esta simulación puede interpretar mal negaciones o contexto.</p>
        <p>No guardamos ni enviamos lo que escribes: todo ocurre en tu navegador.</p>
      </div>

      {error !== null && (
        <p role="alert" className="caja mt-4 font-semibold text-por-fortalecer-texto">
          {error}
        </p>
      )}

      <section aria-live="polite" className="mt-6">
        {resultado !== null && resultado.detectadas.length === 0 && (
          <p className="caja">
            No encontramos competencias en lo que escribiste. Cuéntanos con más detalle qué haces en
            tu trabajo.
          </p>
        )}
        {resultado !== null && resultado.detectadas.length > 0 && (
          <div className="caja">
            <h2>Posibles competencias mencionadas en tu relato</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {resultado.detectadas.map((detectada) => (
                <li
                  key={detectada.id}
                  className="rounded-base bg-ya-tienes-fondo px-2 py-1 text-ya-tienes-texto"
                >
                  {detectada.nombre}
                </li>
              ))}
            </ul>
            <h2 className="mt-6">Ocupaciones parecidas a tu experiencia</h2>
            <ul className="mt-3 space-y-3">
              {resultado.sugerencias.map((sugerencia) => (
                <li key={sugerencia.ocupacion.id}>
                  <a href={`/ocupaciones/${sugerencia.ocupacion.id}/`}>
                    {sugerencia.ocupacion.nombreCorto}
                  </a>
                  <p className="text-base text-texto-suave">
                    Coincide con el {formatearPorcentaje(sugerencia.cobertura * 100, 0)} de sus
                    competencias
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
