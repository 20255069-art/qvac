import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { Competencia } from "../../lib/esquemas.ts";
import type { OcupacionMotor } from "../../lib/pesos.ts";
import { type Sugerencia, sugerirOcupaciones } from "../../lib/sugerencias.ts";
import { crearTraductorQvac, type ModoTraduccion } from "../../lib/traductor/qvac.ts";
import type { CompetenciaDetectada } from "../../lib/traductor/tipos.ts";
import ArbolHabilidades from "./ArbolHabilidades.tsx";
import GrabadorVoz from "./GrabadorVoz.tsx";
import MapaEmpleos from "./MapaEmpleos.tsx";

type Props = {
  ocupaciones: OcupacionMotor[];
  competencias: Pick<Competencia, "id" | "nombre" | "tipo" | "palabrasClave">[];
  mapeo: Record<string, string[]>;
  cursos?: Record<string, { tema: string; url: string; horasReferenciales: number }>;
};

type Resultado = {
  detectadas: CompetenciaDetectada[];
  sugerencias: Sugerencia[];
  modo: ModoTraduccion;
};

const PREGUNTAS = [
  "Cuéntanos un día normal en tu trabajo: ¿qué haces desde que llegas?",
  "Recuerda una vez que resolviste un problema en el trabajo. ¿Qué pasó y qué hiciste?",
  "¿Qué es lo que mejor sabes hacer y por qué te lo reconocen?",
];

const MINIMO_CARACTERES = 15;

const DEPARTAMENTOS = [
  "Lima",
  "Arequipa",
  "La Libertad",
  "Cusco",
  "Piura",
  "Junín",
  "Lambayeque",
  "Callao",
  "Áncash",
  "Ica",
  "San Martín",
  "Loreto",
  "Puno",
  "Tacna",
  "Huánuco",
  "Ayacucho",
  "Cajamarca",
  "Ucayali",
  "Amazonas",
  "Apurímac",
  "Huancavelica",
  "Madre de Dios",
  "Moquegua",
  "Pasco",
  "Tumbes",
];

export default function Entrevista({ ocupaciones, competencias, mapeo, cursos }: Props) {
  const [departamento, setDepartamento] = useState("Lima");
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [analizando, setAnalizando] = useState(false);
  const traductor = useMemo(() => {
    let modo: ModoTraduccion = "qvac";
    const traducir = crearTraductorQvac(competencias, {
      alResolver: (m) => {
        modo = m;
      },
    });
    return async (relatos: string[]) => ({ detectadas: await traducir(relatos), modo });
  }, [competencias]);
  // El botón sale deshabilitado en el HTML del servidor: sin JavaScript (o antes de hidratar)
  // el formulario no puede enviarse por GET y las respuestas nunca llegan a la URL.
  const [hidratado, setHidratado] = useState(false);

  useEffect(() => {
    setHidratado(true);
  }, []);

  // Las respuestas siguen siendo campos sin controlar (se leen con FormData al enviar): el
  // dictado escribe directo en el textarea, sobre lo que ya había al empezar a grabar.
  const areas = useRef<(HTMLTextAreaElement | null)[]>([]);
  const bases = useRef<string[]>([]);
  // Qué pregunta se está dictando: mientras tanto se bloquean los otros micrófonos y el envío.
  const [dictando, setDictando] = useState<number | null>(null);

  function empezarDictado(indice: number) {
    bases.current[indice] = areas.current[indice]?.value.trim() ?? "";
  }

  function dictar(indice: number, texto: string) {
    const area = areas.current[indice];
    if (area) {
      area.value = `${bases.current[indice] ?? ""} ${texto}`.trim();
    }
  }

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
    setAnalizando(true);
    try {
      const { detectadas, modo } = await traductor(respuestas);
      const sugerencias = sugerirOcupaciones(
        detectadas.map((detectada) => detectada.id),
        { ocupaciones, competencias, mapeo },
      );
      setResultado({ detectadas, sugerencias, modo });
    } catch {
      setResultado(null);
      setError("No pudimos analizar tu relato. Inténtalo de nuevo.");
    } finally {
      setAnalizando(false);
    }
  }

  return (
    <div>
      <form onSubmit={enviar} className="caja space-y-5 shadow-sm">
        {PREGUNTAS.map((pregunta, indice) => (
          <div key={pregunta} className="space-y-1.5">
            <label htmlFor={`respuesta-${indice}`} className="block font-semibold text-texto">
              {pregunta}
            </label>
            <textarea
              id={`respuesta-${indice}`}
              name={`respuesta-${indice}`}
              rows={4}
              ref={(area) => {
                areas.current[indice] = area;
              }}
              readOnly={dictando === indice}
              className="mt-1 w-full rounded-md border border-borde p-3 shadow-sm focus:border-primario focus:outline-none focus:ring-1 focus:ring-primario"
            />
            <GrabadorVoz
              etiqueta={`respuesta ${indice + 1}`}
              deshabilitado={dictando !== null || analizando}
              onTextoCapturado={(texto) => dictar(indice, texto)}
              onGrabando={(grabando) => {
                if (grabando) {
                  empezarDictado(indice);
                }
                setDictando(grabando ? indice : null);
              }}
            />
          </div>
        ))}

        {/* Selector de Departamento Institucional MTPE */}
        <div className="space-y-1.5 border-t border-borde pt-3">
          <label htmlFor="departamento" className="block font-semibold text-texto">
            Departamento de residencia o búsqueda laboral:
          </label>
          <select
            id="departamento"
            name="departamento"
            value={departamento}
            onChange={(e) => setDepartamento(e.target.value)}
            className="w-full rounded-md border border-borde bg-white p-2.5 text-texto shadow-sm focus:border-primario focus:outline-none focus:ring-1 focus:ring-primario sm:w-72"
          >
            {DEPARTAMENTOS.map((dep) => (
              <option key={dep} value={dep}>
                {dep}
              </option>
            ))}
          </select>
          <p className="text-xs text-texto-suave">
            Filtra las ofertas laborales y vacantes en planilla de Empleos Perú (MTPE).
          </p>
        </div>

        <button
          type="submit"
          disabled={!hidratado || analizando || dictando !== null}
          aria-busy={analizando}
          className="min-h-12 w-full rounded-md bg-primario px-6 font-semibold text-white shadow-sm hover:bg-primario-oscuro disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {analizando ? "Analizando experiencia con QVAC..." : "Ver mis competencias"}
        </button>
      </form>

      <div className="caja mt-4 space-y-1 text-base text-texto-suave shadow-sm">
        <p>
          El análisis usa QVAC, el motor de IA local-first de Tether, con validación determinista
          sobre el catálogo CNPO del MTPE: solo se aceptan competencias que existen en él.
        </p>
        <p>
          Si QVAC no responde, usamos una simulación por palabras clave, que puede interpretar mal
          negaciones o contexto.
        </p>
        <p>
          No guardamos lo que escribes: tu relato solo viaja a nuestro servidor para analizarlo con
          QVAC y no se almacena.
        </p>
        <p>
          Si dictas con la voz, el audio lo transcribe el servicio de reconocimiento de voz de tu
          navegador (en Chrome y Edge funciona en la nube); nosotros solo recibimos el texto.
        </p>
      </div>

      {error !== null && (
        <p role="alert" className="caja mt-4 font-semibold text-por-fortalecer-texto shadow-sm">
          {error}
        </p>
      )}

      <section aria-live="polite" className="mt-6">
        {resultado !== null && resultado.detectadas.length === 0 && (
          <p className="caja shadow-sm">
            No encontramos competencias en lo que escribiste. Cuéntanos con más detalle qué haces en
            tu trabajo.
          </p>
        )}
        {resultado !== null && resultado.detectadas.length > 0 && (
          <div className="space-y-6">
            <div className="caja space-y-4 shadow-sm">
              <h2>Posibles competencias mencionadas en tu relato</h2>
              <p className="text-base text-texto-suave">
                {resultado.modo === "qvac"
                  ? "Analizado con QVAC."
                  : "QVAC no estuvo disponible: resultado de la simulación por palabras clave."}
              </p>
              <ArbolHabilidades
                detectadas={resultado.detectadas}
                sugerencias={resultado.sugerencias}
                todasCompetencias={competencias}
                mapeo={mapeo}
                cursos={cursos}
              />
            </div>

            <MapaEmpleos
              departamento={departamento}
              ocupacionSugerida={resultado.sugerencias[0]?.ocupacion.nombreCorto}
            />
          </div>
        )}
      </section>
    </div>
  );
}
