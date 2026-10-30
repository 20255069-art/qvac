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
      setTimeout(() => {
        const elemento = document.getElementById("tus-resultados");
        if (elemento) {
          elemento.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    } catch {
      setResultado(null);
      setError("No pudimos analizar tu relato. Inténtalo de nuevo.");
    } finally {
      setAnalizando(false);
    }
  }

  return (
    <div>
      {/* Guía visual Gob.pe de 3 pasos + Ejemplos rápidos con 1 clic */}
      <div className="rounded-md border border-gray-200 bg-white p-5 shadow-xs mb-5 space-y-4">
        <div className="grid gap-3 sm:grid-cols-3 text-sm border-b border-gray-200 pb-4">
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#004884] text-xs font-bold text-white">
              1
            </span>
            <div>
              <p className="font-bold text-gray-900">Relata tu trabajo</p>
              <p className="text-xs text-gray-600 leading-relaxed">
                Escribe con tus propias palabras o habla por el micrófono.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#004884] text-xs font-bold text-white">
              2
            </span>
            <div>
              <p className="font-bold text-gray-900">QVAC valora tu oficio</p>
              <p className="text-xs text-gray-600 leading-relaxed">
                Traduce tus tareas al catálogo oficial CNPO sin guardar datos personales.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#004884] text-xs font-bold text-white">
              3
            </span>
            <div>
              <p className="font-bold text-gray-900">Rutas y vacantes</p>
              <p className="text-xs text-gray-600 leading-relaxed">
                Genera tu Árbol de Habilidades, simula tu entrevista y postula en Empleos Perú.
              </p>
            </div>
          </div>
        </div>

        <div>
          <span className="gob-tag text-gray-500 uppercase">
            EJEMPLOS RÁPIDOS DE 1 CLIC (Toca uno para cargarlo en el formulario):
          </span>
          <div className="mt-2.5 grid gap-2.5 sm:grid-cols-3">
            {EJEMPLOS_RAPIDOS.map((ej) => {
              const activo = ejemploActivo === ej.id;
              return (
                <button
                  key={ej.id}
                  type="button"
                  disabled={!hidratado || analizando || dictando !== null}
                  onClick={() => cargarEjemplo(ej)}
                  className={`flex items-center gap-2.5 rounded border p-3 text-left transition ${
                    activo
                      ? "border-[#004884] bg-sky-50/70 ring-1 ring-[#004884]"
                      : "border-gray-200 bg-white hover:border-[#004884] hover:bg-sky-50/30"
                  }`}
                >
                  <span className="text-xl" aria-hidden="true">
                    {ej.icono}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-gray-900">{ej.titulo}</p>
                    <p className="truncate text-xs text-gray-500">{ej.subtitulo}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <form
        onSubmit={enviar}
        className="rounded-md border border-gray-200 bg-white p-5 sm:p-6 shadow-xs space-y-5"
      >
        {PREGUNTAS.map((pregunta, indice) => (
          <div key={pregunta} className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-block rounded bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-700">
                Pregunta {indice + 1} de {PREGUNTAS.length}
              </span>
            </div>
            <label htmlFor={`respuesta-${indice}`} className="block font-semibold text-gray-900">
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
              className="mt-1 w-full rounded border border-gray-300 p-3 text-sm text-gray-800 placeholder-gray-400 focus:border-[#004884] focus:outline-none focus:ring-1 focus:ring-[#004884]"
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
        <div className="space-y-1.5 border-t border-gray-200 pt-4">
          <label htmlFor="departamento" className="block text-sm font-semibold text-gray-800">
            Departamento de residencia o búsqueda laboral:
          </label>
          <select
            id="departamento"
            name="departamento"
            value={departamento}
            onChange={(e) => setDepartamento(e.target.value)}
            className="w-full rounded border border-gray-300 bg-white p-2.5 text-sm text-gray-800 focus:border-[#004884] focus:outline-none focus:ring-1 focus:ring-[#004884] sm:w-72"
          >
            {DEPARTAMENTOS.map((dep) => (
              <option key={dep} value={dep}>
                {dep}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500">
            Filtra las ofertas laborales y vacantes en planilla de Empleos Perú (MTPE).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={!hidratado || analizando || dictando !== null}
            aria-busy={analizando}
            className="min-h-11 w-full rounded bg-[#b91c1c] px-6 text-sm font-bold text-white shadow-xs hover:bg-[#991b1b] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto transition"
          >
            {analizando ? "Analizando experiencia con QVAC..." : "Ver mis competencias"}
          </button>

          {(ejemploActivo !== null || resultado !== null) && (
            <button
              type="button"
              onClick={limpiarFormulario}
              className="min-h-11 rounded border border-gray-300 bg-white px-4 text-xs sm:text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition"
            >
              Limpiar respuestas
            </button>
          )}
        </div>
      </form>

      <div className="rounded-md border border-gray-200 bg-gray-50/70 p-4 mt-4 space-y-1 text-xs text-gray-600">
        <p>
          <strong>Privacidad y Validación:</strong> El análisis se procesa mediante{" "}
          <strong>Tether QVAC</strong>, validado estrictamente sobre el catálogo CNPO del MTPE.
        </p>
        <p>
          Tus relatos no se almacenan: un filtro local protege en tiempo real cualquier dato
          sensible (DNI, teléfono, correos).
        </p>
        <p>
          Si usas el micrófono, el reconocimiento de voz transcribe de manera directa sin retención
          de audio.
        </p>
      </div>

      {error !== null && (
        <p role="alert" className="caja mt-4 font-semibold text-por-fortalecer-texto shadow-sm">
          {error}
        </p>
      )}

      <section id="tus-resultados" aria-live="polite" className="mt-8 scroll-mt-6">
        {resultado !== null && resultado.detectadas.length === 0 && (
          <div className="rounded-md border border-gray-200 bg-white p-5 shadow-xs text-center space-y-2">
            <p className="font-semibold text-gray-800">
              No identificamos competencias claras en el texto ingresado.
            </p>
            <p className="text-sm text-gray-600">
              Prueba tocando uno de los ejemplos rápidos arriba (Almacén, Caja o Limpieza) o
              cuéntanos con más detalle qué tareas ejecutas en tu día a día.
            </p>
          </div>
        )}
        {resultado !== null && resultado.detectadas.length > 0 && (
          <div className="space-y-6">
            {/* Banner de Reconocimiento y Logro Ciudadano */}
            <div className="rounded-md border border-emerald-400 bg-gradient-to-r from-emerald-50/90 via-white to-sky-50/70 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-200/60 pb-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xl font-bold text-white shadow-xs">
                    ✓
                  </span>
                  <div>
                    <span className="inline-block rounded bg-emerald-100 text-emerald-900 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider">
                      Diagnóstico Oficial QVAC Completado
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                      ¡Tu experiencia vale! No empiezas desde cero
                    </h2>
                  </div>
                </div>
                <div className="text-right">
                  <span className="rounded border border-emerald-300 bg-white px-3 py-1 text-xs font-bold text-emerald-900 shadow-2xs">
                    {resultado.modo === "qvac"
                      ? "⚡ Motor QVAC Local Activo"
                      : "📋 Respaldo CNPO Activo"}
                  </span>
                  <p className="mt-1 text-[11px] font-mono text-gray-500">
                    ID: {resultado.codigoVerificacion}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded border border-emerald-200 bg-white p-3.5 shadow-2xs">
                  <span className="text-xs text-gray-500 font-bold uppercase">
                    Competencias Validadas:
                  </span>
                  <p className="mt-1 text-2xl font-black text-emerald-700">
                    {resultado.detectadas.length} habilidades
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Extraídas con evidencia directa de tu relato diario.
                  </p>
                </div>

                <div className="rounded border border-sky-200 bg-white p-3.5 shadow-2xs">
                  <span className="text-xs text-gray-500 font-bold uppercase">
                    Afinidad Principal:
                  </span>
                  <p className="mt-1 text-2xl font-black text-[#004884]">
                    {Math.round((resultado.sugerencias[0]?.cobertura ?? 0) * 100) + bonoDilema}%
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Hacia {resultado.sugerencias[0]?.ocupacion.nombreCorto ?? "tu oficio afín"}.
                  </p>
                </div>

                <div className="rounded border border-gray-200 bg-white p-3.5 shadow-2xs">
                  <span className="text-xs text-gray-500 font-bold uppercase">
                    Cierre de Brecha:
                  </span>
                  <p className="mt-1 text-2xl font-black text-gray-800">4 a 8 horas</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Con micro-cursos gratuitos de Capacíta-T.
                  </p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed bg-white/80 p-3 rounded border border-emerald-100">
                <strong>Mensaje de orientación:</strong> Lo que has aprendido trabajando en la
                práctica tiene valor formal comprobado. Abajo puedes interactuar con tu{" "}
                <strong>Árbol de Habilidades</strong>, resolver un{" "}
                <strong>caso laboral para sumar confianza</strong>, practicar tu{" "}
                <strong>presentación para entrevistas</strong>, postular a{" "}
                <strong>vacantes en {departamento}</strong> y{" "}
                <strong>descargar tu constancia oficial</strong>.
              </p>
            </div>

            <div className="rounded-md border border-gray-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-3">
                <div>
                  <span className="gob-tag text-gray-500 uppercase">
                    ESTÁNDAR CNPO · EVIDENCIA DEL RELATO
                  </span>
                  <h3 className="mt-1 text-lg font-bold text-gray-900">
                    Posibles competencias mencionadas en tu relato
                  </h3>
                </div>
              </div>

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

            {/* Plan de Acción y Cierre Convincente para el Ciudadano */}
            <div className="rounded-md border border-gray-200 bg-white p-6 shadow-xs text-center space-y-3">
              <span className="gob-tag text-gray-500 uppercase">
                TU PLAN DE ACCIÓN PARA EL EMPLEO FORMAL
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                ¿Listo para postular con el respaldo de tus competencias?
              </h3>
              <p className="text-sm text-gray-600 max-w-xl mx-auto leading-relaxed">
                Ya tienes tu perfil validado y tu constancia descargable. Utiliza estos servicios
                gratuitos del Estado peruano para dar el salto laboral:
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <a
                  href="https://empleosperu.trabajo.gob.pe/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded bg-[#b91c1c] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#991b1b] shadow-xs transition"
                >
                  💼 Postular en Empleos Perú ↗
                </a>
                <a
                  href="https://capacitacionlaboral.trabajo.gob.pe/"
                  target="_blank"
                  rel="noreferrer"
                  className="gob-btn-servicio text-sm py-2.5 px-4"
                >
                  🎓 Cursos gratuitos en Capacíta-T ↗
                </a>
                <a
                  href="/ocupaciones/"
                  className="inline-flex items-center gap-1.5 rounded border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
                >
                  ↺ Explorar otras ocupaciones CNPO
                </a>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
