import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { Competencia } from "../../lib/esquemas.ts";
import type { OcupacionMotor } from "../../lib/pesos.ts";
import { generarCodigoVerificacionQvac, sanitizarRelatoCiudadano } from "../../lib/privacidad.ts";
import { type Sugerencia, sugerirOcupaciones } from "../../lib/sugerencias.ts";
import { crearTraductorQvac, type ModoTraduccion } from "../../lib/traductor/qvac.ts";
import type { CompetenciaDetectada } from "../../lib/traductor/tipos.ts";
import ArbolHabilidades from "./ArbolHabilidades.tsx";
import DilemaSituacional from "./DilemaSituacional.tsx";
import FichaReconversion from "./FichaReconversion.tsx";
import GrabadorVoz from "./GrabadorVoz.tsx";
import MapaEmpleos from "./MapaEmpleos.tsx";
import SimuladorEntrevista from "./SimuladorEntrevista.tsx";

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
  codigoVerificacion: string;
  datosProtegidos: string[];
};

const PREGUNTAS = [
  "Cuéntanos un día normal en tu trabajo: ¿qué haces desde que llegas?",
  "Recuerda una vez que resolviste un problema en el trabajo. ¿Qué pasó y qué hiciste?",
  "¿Qué es lo que mejor sabes hacer y por qué te lo reconocen?",
];

const EJEMPLOS_PISTA = [
  "Ejemplo: Desde temprano recibo la mercadería, reviso las fechas de vencimiento, ordeno los anaqueles y atiendo a los clientes con amabilidad...",
  "Ejemplo: Un día no cuadraba la caja al cierre, revisé las boletas y los cobros de Yape uno por uno hasta encontrar el vuelto pendiente...",
  "Ejemplo: Me reconocen porque soy rápido dando vuelto, mantengo todo limpio y ordenado y tengo paciencia con la gente...",
];

type EjemploRelato = {
  id: string;
  titulo: string;
  subtitulo: string;
  icono: string;
  respuestas: [string, string, string];
};

const EJEMPLOS_RAPIDOS: EjemploRelato[] = [
  {
    id: "almacen",
    titulo: "Almacén / Bodega",
    subtitulo: "Recepción, stock y orden",
    icono: "📦",
    respuestas: [
      "Llego a las 7 de la mañana para recibir la mercadería de los proveedores, reviso las guías de remisión y anoto las entradas y salidas en el cuaderno de stock y en una hoja de Excel.",
      "Una vez llegaron cajas con productos por vencer; separé el lote, apliqué rotación FIFO poniendo adelante lo más próximo a vencer y ordené todo el almacén dejándolo limpio.",
      "Me reconocen porque cuento rápido el inventario, mantengo los pasillos despejados y atiendo con buen trato a los repartidores y clientes.",
    ],
  },
  {
    id: "caja",
    titulo: "Caja / Bodega o Tienda",
    subtitulo: "Cobros, Yape y atención",
    icono: "💳",
    respuestas: [
      "Atiendo al público en el mostrador desde temprano, recibo pagos en efectivo dando vuelto exacto y también cobro con Yape, Plin y tarjeta en el POS entregando boleta o factura.",
      "En hora punta un cliente reclamó que su pago digital ya había salido; verifiqué el número de operación en el celular de la tienda, tranquilicé al cliente con respeto y cuadré la caja al cierre sin faltantes.",
      "Dicen que soy de confianza porque mi arqueo de caja siempre cuadra al centavo y registro todas las ventas en la computadora sin equivocarme.",
    ],
  },
  {
    id: "limpieza",
    titulo: "Limpieza / Hotelería",
    subtitulo: "Desinfección y orden 5S",
    icono: "✨",
    respuestas: [
      "Desde que ingreso organizo mi carrito de trabajo, barro, trapeo y desinfecto los baños, pasillos y habitaciones usando lejía y desinfectante según cada superficie.",
      "Un día hubo una entrega urgente de ambientes antes de un evento; organicé las herramientas por zonas, limpié los vidrios y dejé todo impecable y ventilado a tiempo.",
      "Me felicitan porque soy muy detallista con la higiene, cuido los insumos en el almacén y trato con mucha cortesía a los visitantes y compañeros.",
    ],
  },
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
  const [ejemploActivo, setEjemploActivo] = useState<string | null>(null);
  const [bonoDilema, setBonoDilema] = useState(0);

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

  function cargarEjemplo(ejemplo: EjemploRelato) {
    ejemplo.respuestas.forEach((texto, idx) => {
      const area = areas.current[idx];
      if (area) {
        area.value = texto;
      }
    });
    setEjemploActivo(ejemplo.id);
    setError(null);
  }

  function limpiarFormulario() {
    areas.current.forEach((area) => {
      if (area) area.value = "";
    });
    setEjemploActivo(null);
    setResultado(null);
    setBonoDilema(0);
    setError(null);
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
    setBonoDilema(0);
    try {
      const auditoriaPii = sanitizarRelatoCiudadano(respuestas.join("\n"));
      const { detectadas, modo } = await traductor(respuestas);
      const sugerencias = sugerirOcupaciones(
        detectadas.map((detectada) => detectada.id),
        { ocupaciones, competencias, mapeo },
      );
      const codigoVerificacion = generarCodigoVerificacionQvac(
        detectadas.map((d) => d.id),
        departamento,
      );
      setResultado({
        detectadas,
        sugerencias,
        modo,
        codigoVerificacion,
        datosProtegidos: auditoriaPii.tiposDetectados,
      });
    } catch {
      setResultado(null);
      setError("No pudimos analizar tu relato. Inténtalo de nuevo.");
    } finally {
      setAnalizando(false);
    }
  }

  return (
    <div>
      {/* Guía visual amable de 3 pasos + Ejemplos rápidos con 1 clic */}
      <div className="caja mb-5 border-l-4 border-l-primario bg-gradient-to-r from-red-50/50 via-white to-white shadow-sm">
        <div className="grid gap-3 sm:grid-cols-3 text-sm border-b border-borde pb-3.5">
          <div className="flex items-start gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primario text-xs font-bold text-white">
              1
            </span>
            <div>
              <p className="font-bold text-texto">Cuenta lo que haces</p>
              <p className="text-xs text-texto-suave">
                Escribe con tus propias palabras o habla por el micrófono.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primario text-xs font-bold text-white">
              2
            </span>
            <div>
              <p className="font-bold text-texto">QVAC valora tu oficio</p>
              <p className="text-xs text-texto-suave">
                Traduce tu práctica diaria al catálogo oficial del MTPE.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primario text-xs font-bold text-white">
              3
            </span>
            <div>
              <p className="font-bold text-texto">Postula con respaldo</p>
              <p className="text-xs text-texto-suave">
                Descarga tu ficha y mira vacantes cerca de ti.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3">
          <p className="text-xs font-bold uppercase tracking-wide text-texto-suave">
            💡 ¿No sabes cómo empezar? Toca un ejemplo parecido a tu trabajo para guiarte:
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {EJEMPLOS_RAPIDOS.map((ej) => {
              const activo = ejemploActivo === ej.id;
              return (
                <button
                  key={ej.id}
                  type="button"
                  disabled={!hidratado || analizando || dictando !== null}
                  onClick={() => cargarEjemplo(ej)}
                  className={`flex items-center gap-2.5 rounded-md border p-2.5 text-left transition ${
                    activo
                      ? "border-primario bg-red-50/80 ring-1 ring-primario"
                      : "border-borde bg-white hover:border-gray-400 hover:bg-superficie"
                  }`}
                >
                  <span className="text-xl" aria-hidden="true">
                    {ej.icono}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-texto">{ej.titulo}</p>
                    <p className="truncate text-xs text-texto-suave">{ej.subtitulo}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <form onSubmit={enviar} className="caja space-y-5 shadow-sm">
        {PREGUNTAS.map((pregunta, indice) => (
          <div key={pregunta} className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-block rounded bg-red-100 px-2 py-0.5 text-xs font-bold text-primario">
                Pregunta {indice + 1} de {PREGUNTAS.length}
              </span>
            </div>
            <label htmlFor={`respuesta-${indice}`} className="block font-semibold text-texto">
              {pregunta}
            </label>
            <textarea
              id={`respuesta-${indice}`}
              name={`respuesta-${indice}`}
              rows={4}
              placeholder={EJEMPLOS_PISTA[indice]}
              ref={(area) => {
                areas.current[indice] = area;
              }}
              readOnly={dictando === indice}
              className="mt-1 w-full rounded-md border border-borde p-3 shadow-sm placeholder:text-gray-400 focus:border-primario focus:outline-none focus:ring-1 focus:ring-primario"
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

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={!hidratado || analizando || dictando !== null}
            aria-busy={analizando}
            className="min-h-12 w-full rounded-md bg-primario px-6 font-semibold text-white shadow-sm hover:bg-primario-oscuro disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {analizando ? "Analizando experiencia con QVAC..." : "Ver mis competencias"}
          </button>

          {(ejemploActivo !== null || resultado !== null) && (
            <button
              type="button"
              onClick={limpiarFormulario}
              className="min-h-12 rounded-md border border-borde bg-white px-4 text-sm font-semibold text-texto-suave hover:bg-superficie hover:text-texto"
            >
              Limpiar respuestas
            </button>
          )}
        </div>
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
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-borde pb-3">
                <div>
                  <span className="inline-block rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-900">
                    ✨ ¡Tu experiencia vale mucho! No empiezas desde cero
                  </span>
                  <h2 className="mt-1">Posibles competencias mencionadas en tu relato</h2>
                </div>
                <span className="rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-900">
                  {resultado.modo === "qvac"
                    ? "⚡ Motor QVAC Local Activo"
                    : "📋 Modo Respaldo CNPO"}
                </span>
              </div>

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

            {resultado.sugerencias[0] && (
              <>
                <DilemaSituacional
                  ocupacionId={resultado.sugerencias[0].ocupacion.id}
                  ocupacionNombre={resultado.sugerencias[0].ocupacion.nombreCorto}
                  onDilemaResuelto={(opcion) => setBonoDilema(opcion.bonoConfianza)}
                />

                <SimuladorEntrevista
                  detectadas={resultado.detectadas}
                  ocupacionNombre={resultado.sugerencias[0].ocupacion.nombreCorto}
                  porcentajeAfinidad={Math.min(
                    100,
                    Math.round(resultado.sugerencias[0].cobertura * 100) + bonoDilema,
                  )}
                  departamento={departamento}
                />
              </>
            )}

            <FichaReconversion
              detectadas={resultado.detectadas}
              sugerencias={resultado.sugerencias}
              departamento={departamento}
              modo={resultado.modo}
              codigoVerificacion={resultado.codigoVerificacion}
              datosProtegidos={resultado.datosProtegidos}
              bonoDilema={bonoDilema}
            />

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
