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

type PestañaResultado = "resumen" | "habilidades" | "mapa" | "constancia" | "practica";

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

  // Estados de navegación progresiva amigable para evitar saturación
  const [pestañaActiva, setPestañaActiva] = useState<PestañaResultado>("resumen");
  const [mostrarFormulario, setMostrarFormulario] = useState(true);

  const traductor = useMemo(() => {
    let modo: ModoTraduccion = "qvac";
    const traducir = crearTraductorQvac(competencias, {
      alResolver: (m) => {
        modo = m;
      },
    });
    return async (relatos: string[]) => ({ detectadas: await traducir(relatos), modo });
  }, [competencias]);

  const [hidratado, setHidratado] = useState(false);

  useEffect(() => {
    setHidratado(true);
  }, []);

  const areas = useRef<(HTMLTextAreaElement | null)[]>([]);
  const bases = useRef<string[]>([]);
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
    setMostrarFormulario(true);
    setPestañaActiva("resumen");
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

      // Al terminar con éxito: colapsamos el formulario para no saturar al usuario
      setMostrarFormulario(false);
      setPestañaActiva("resumen");

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

  function cambiarPestaña(nueva: PestañaResultado) {
    setPestañaActiva(nueva);
    const elemento = document.getElementById("tus-resultados");
    if (elemento) {
      elemento.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  const PESTAÑAS: { id: PestañaResultado; titulo: string; subtitulo: string; icono: string }[] = [
    {
      id: "resumen",
      titulo: "Mis Ocupaciones Afines",
      subtitulo: "Opciones formales y afinidad",
      icono: "🎯",
    },
    {
      id: "habilidades",
      titulo: "Mis Habilidades (CNPO)",
      subtitulo: "Detalle de competencias",
      icono: "🌳",
    },
    {
      id: "mapa",
      titulo: "Dónde hay Empleo",
      subtitulo: `Demanda en ${departamento}`,
      icono: "🗺️",
    },
    {
      id: "constancia",
      titulo: "Mi CV y Constancia",
      subtitulo: "Ficha oficial descargable",
      icono: "📄",
    },
    {
      id: "practica",
      titulo: "Practicar Entrevista",
      subtitulo: "Simulador por voz con IA",
      icono: "🎙️",
    },
  ];

  return (
    <div>
      {/* Barra de estado cuando el resultado ya está generado */}
      {resultado !== null && (
        <div className="rounded-md border border-emerald-300 bg-emerald-50/70 p-4 shadow-xs mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white shadow-2xs">
              ✓
            </span>
            <div>
              <p className="text-sm font-bold text-gray-900">
                Tu entrevista está analizada y validada por el MTPE
              </p>
              <p className="text-xs text-gray-600">
                Búsqueda laboral en <strong>{departamento}</strong> · Folio QVAC:{" "}
                <span className="font-mono text-gray-700">{resultado.codigoVerificacion}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMostrarFormulario(!mostrarFormulario)}
              className="inline-flex items-center gap-1.5 rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-2xs transition"
            >
              {mostrarFormulario ? "▲ Ocultar preguntas" : "✏️ Modificar mis respuestas"}
            </button>
            <button
              type="button"
              onClick={limpiarFormulario}
              className="rounded border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition"
            >
              Nueva consulta
            </button>
          </div>
        </div>
      )}

      {/* Formulario de la Entrevista (Se muestra si no hay resultado, o si el usuario pide modificar respuestas) */}
      {(resultado === null || mostrarFormulario) && (
        <div className="space-y-5 mb-8">
          {/* Guía visual Gob.pe de 3 pasos + Ejemplos rápidos con 1 clic */}
          <div className="rounded-md border border-gray-200 bg-white p-5 shadow-xs space-y-4">
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
                    Descubre ocupaciones formales afines y postula en Empleos Perú.
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
                <label
                  htmlFor={`respuesta-${indice}`}
                  className="block font-semibold text-gray-900"
                >
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

          <div className="rounded-md border border-gray-200 bg-gray-50/70 p-4 space-y-1 text-xs text-gray-600">
            <p>
              <strong>Privacidad y Validación:</strong> El análisis se procesa mediante{" "}
              <strong>Tether QVAC</strong>, validado estrictamente sobre el catálogo CNPO del MTPE.
            </p>
            <p>
              Tus relatos no se almacenan: un filtro local protege en tiempo real cualquier dato
              sensible (DNI, teléfono, correos).
            </p>
          </div>
        </div>
      )}

      {error !== null && (
        <p role="alert" className="caja mb-6 font-semibold text-por-fortalecer-texto shadow-sm">
          {error}
        </p>
      )}

      {/* SECCIÓN DE RESULTADOS PROGRESIVA Y NO SATURANTE */}
      <section id="tus-resultados" aria-live="polite" className="scroll-mt-6">
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
            {/* PESTAÑERO DE RESULTADOS ESTILO GOB.PE (Navegación limpia sin sobrecarga visual) */}
            <div className="border-b border-gray-300 bg-[#e5e7eb] px-2 sm:px-4 rounded-t-md">
              <div
                role="tablist"
                aria-label="Pestañas de resultados de reconversión laboral"
                className="flex flex-nowrap items-end gap-1 overflow-x-auto text-xs sm:text-sm scrollbar-none pt-2"
              >
                {PESTAÑAS.map((tab) => {
                  const activo = pestañaActiva === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={activo}
                      onClick={() => cambiarPestaña(tab.id)}
                      className={activo ? "gob-tab-activo" : "gob-tab"}
                    >
                      <span className="flex items-center gap-1.5">
                        <span aria-hidden="true">{tab.icono}</span>
                        <span className="font-bold">{tab.titulo}</span>
                      </span>
                      <span className="hidden sm:block text-[11px] opacity-75">
                        {tab.subtitulo}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PESTAÑA 1: RESUMEN Y OCUPACIONES AFINES */}
            {pestañaActiva === "resumen" && (
              <div className="space-y-6">
                {/* Banner de Reconocimiento Oficial */}
                <div className="rounded-md border border-emerald-400 bg-gradient-to-r from-emerald-50/90 via-white to-sky-50/70 p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-200/60 pb-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xl font-bold text-white shadow-xs">
                        ✓
                      </span>
                      <div>
                        <span className="inline-block rounded bg-emerald-100 text-emerald-900 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider">
                          Validación Oficial QVAC · MTPE
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
                        Folio: {resultado.codigoVerificacion}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded border border-emerald-200 bg-white p-3.5 shadow-2xs">
                      <span className="text-xs text-gray-500 font-bold uppercase">
                        Habilidades Demostradas:
                      </span>
                      <p className="mt-1 text-2xl font-black text-emerald-700">
                        {resultado.detectadas.length} identificadas
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Detectadas a partir de tus tareas reales de trabajo.
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
                        Cursos gratuitos y certificados con Capacíta-T.
                      </p>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed bg-white/80 p-3 rounded border border-emerald-100">
                    <strong>Mensaje de empatía laboral:</strong> Todo lo que has aprendido en el día
                    a día tiene valor formal comprobado. No necesitas haber estudiado una carrera
                    técnica para postular a puestos formales. Revisa abajo las ocupaciones
                    sugeridas.
                  </p>
                </div>

                {/* Lista de Ocupaciones Sugeridas */}
                <div className="rounded-md border border-gray-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="border-b border-gray-200 pb-3">
                    <span className="gob-tag text-gray-500 uppercase">
                      OCUPACIONES CON ALTA DEMANDA EN {departamento.toUpperCase()}
                    </span>
                    <h3 className="mt-1 text-lg sm:text-xl font-bold text-gray-900">
                      Puestos formales a los que puedes postular con tu experiencia
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Estas son las ocupaciones del Catálogo Nacional (CNPO) que mejor se adaptan a
                      lo que nos contaste:
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {resultado.sugerencias.slice(0, 3).map((sug, idx) => {
                      const porcentaje = Math.min(
                        100,
                        Math.round(sug.cobertura * 100) + (idx === 0 ? bonoDilema : 0),
                      );
                      const requeridas = mapeo[sug.ocupacion.id] ?? [];
                      const coincidentesCount = requeridas.filter((id) =>
                        resultado.detectadas.some((d) => d.id === id),
                      ).length;
                      return (
                        <div
                          key={sug.ocupacion.id}
                          className="rounded border border-gray-200 bg-gray-50/50 p-4 shadow-2xs space-y-3 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="inline-block rounded bg-[#004884]/10 text-[#004884] px-2 py-0.5 text-xs font-bold">
                                Opción #{idx + 1}
                              </span>
                              <span className="text-sm font-black text-emerald-700">
                                {porcentaje}% afín
                              </span>
                            </div>
                            <h4 className="mt-2 text-base font-bold text-gray-900">
                              {sug.ocupacion.nombreCorto}
                            </h4>
                            <p className="text-xs text-gray-600 mt-1">
                              Coincides en <strong>{coincidentesCount} competencias</strong>{" "}
                              directas requeridas por las empresas.
                            </p>
                          </div>

                          <div className="space-y-2 pt-2 border-t border-gray-200/70">
                            <a
                              href="https://empleosperu.trabajo.gob.pe/"
                              target="_blank"
                              rel="noreferrer"
                              className="w-full text-center inline-block rounded bg-[#b91c1c] px-3 py-2 text-xs font-bold text-white hover:bg-[#991b1b] shadow-2xs transition"
                            >
                              Ver vacantes en Empleos Perú ↗
                            </a>
                            <button
                              type="button"
                              onClick={() => cambiarPestaña("habilidades")}
                              className="w-full text-center inline-block rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                            >
                              Ver habilidades necesarias →
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Botones de navegación al pie de la Pestaña 1 */}
                  <div className="rounded bg-sky-50/60 p-4 border border-sky-100 flex flex-wrap items-center justify-between gap-3 mt-4">
                    <div>
                      <p className="text-sm font-bold text-gray-900">¿Qué deseas revisar ahora?</p>
                      <p className="text-xs text-gray-600">
                        Puedes explorar tus habilidades detalladas, ver vacantes o descargar tu
                        constancia.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => cambiarPestaña("habilidades")}
                        className="inline-flex items-center gap-1.5 rounded bg-[#004884] px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-[#003666] shadow-xs transition"
                      >
                        🌳 Ver mis habilidades CNPO →
                      </button>
                      <button
                        type="button"
                        onClick={() => cambiarPestaña("mapa")}
                        className="inline-flex items-center gap-1.5 rounded border border-gray-300 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                      >
                        🗺️ Ver mapa laboral
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA 2: DETALLE DE HABILIDADES CNPO (Árbol de Habilidades) */}
            {pestañaActiva === "habilidades" && (
              <div className="space-y-6">
                <div className="rounded-md border border-gray-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="border-b border-gray-200 pb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="gob-tag text-gray-500 uppercase">
                        CATÁLOGO NACIONAL DE PERFILES OCUPACIONALES (CNPO)
                      </span>
                      <h3 className="mt-1 text-lg sm:text-xl font-bold text-gray-900">
                        Árbol de Habilidades Laborales Demostradas
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Estas son las competencias que el Ministerio de Trabajo y las empresas
                        formales reconocen de tu experiencia:
                      </p>
                    </div>
                  </div>

                  <ArbolHabilidades
                    detectadas={resultado.detectadas}
                    sugerencias={resultado.sugerencias}
                    todasCompetencias={competencias}
                    mapeo={mapeo}
                    cursos={cursos}
                  />

                  <div className="pt-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => cambiarPestaña("resumen")}
                      className="inline-flex items-center gap-1 rounded border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                    >
                      ← Volver a mis ocupaciones
                    </button>
                    <button
                      type="button"
                      onClick={() => cambiarPestaña("mapa")}
                      className="inline-flex items-center gap-1.5 rounded bg-[#b91c1c] px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-[#991b1b] shadow-xs transition"
                    >
                      Siguiente: Consultar vacantes en {departamento} 🗺️ →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA 3: MAPA DE EMPLEO POR DEPARTAMENTO */}
            {pestañaActiva === "mapa" && (
              <div className="space-y-6">
                <div className="rounded-md border border-gray-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="border-b border-gray-200 pb-3">
                    <span className="gob-tag text-gray-500 uppercase">
                      BOLSA PÚBLICA DE EMPLEO · MTPE
                    </span>
                    <h3 className="mt-1 text-lg sm:text-xl font-bold text-gray-900">
                      Oportunidades de Empleo Formal en {departamento}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Revisa la demanda real de trabajadores en planilla y salarios promedio
                      registrados por las empresas en el portal oficial Empleos Perú:
                    </p>
                  </div>

                  <MapaEmpleos
                    departamento={departamento}
                    ocupacionSugerida={resultado.sugerencias[0]?.ocupacion.nombreCorto}
                  />

                  <div className="pt-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => cambiarPestaña("habilidades")}
                      className="inline-flex items-center gap-1 rounded border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                    >
                      ← Volver a habilidades
                    </button>
                    <button
                      type="button"
                      onClick={() => cambiarPestaña("constancia")}
                      className="inline-flex items-center gap-1.5 rounded bg-[#b91c1c] px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-[#991b1b] shadow-xs transition"
                    >
                      Siguiente: Mi Constancia oficial y CV 📄 →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA 4: FICHA DE RECONVERSIÓN Y DESCARGA DE CONSTANCIA GOB.PE */}
            {pestañaActiva === "constancia" && (
              <div className="space-y-6">
                <div className="rounded-md border border-gray-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="border-b border-gray-200 pb-3">
                    <span className="gob-tag text-gray-500 uppercase">
                      CERTIFICACIÓN Y CONSTANCIA CIUDADANA GOB.PE
                    </span>
                    <h3 className="mt-1 text-lg sm:text-xl font-bold text-gray-900">
                      Tu Ficha Oficial de Competencias y Bloque para CV
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Descarga tu documento oficial o copia el resumen con código de verificación
                      QVAC para que los reclutadores validen tu experiencia formal:
                    </p>
                  </div>

                  <FichaReconversion
                    detectadas={resultado.detectadas}
                    sugerencias={resultado.sugerencias}
                    departamento={departamento}
                    modo={resultado.modo}
                    codigoVerificacion={resultado.codigoVerificacion}
                    datosProtegidos={resultado.datosProtegidos}
                    bonoDilema={bonoDilema}
                  />

                  <div className="pt-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => cambiarPestaña("mapa")}
                      className="inline-flex items-center gap-1 rounded border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                    >
                      ← Volver a mapa de empleo
                    </button>
                    <button
                      type="button"
                      onClick={() => cambiarPestaña("practica")}
                      className="inline-flex items-center gap-1.5 rounded bg-[#004884] px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-[#003666] shadow-xs transition"
                    >
                      Paso Opcional: Practicar entrevista laboral 🎙️ →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA 5: PRÁCTICA Y SIMULADOR DE ENTREVISTA (OPCIONAL) */}
            {pestañaActiva === "practica" && (
              <div className="space-y-6">
                <div className="rounded-md border border-gray-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="border-b border-gray-200 pb-3">
                    <span className="gob-tag text-gray-500 uppercase">
                      ENTRENADOR LABORAL SIN EXÁMENES
                    </span>
                    <h3 className="mt-1 text-lg sm:text-xl font-bold text-gray-900">
                      Practica con IA antes de tu Entrevista de Trabajo
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Aquí puedes ensayar con tranquilidad. Resuelve un caso práctico de trabajo
                      para sumar puntos de confianza y escucha al simulador de voz:
                    </p>
                  </div>

                  {resultado.sugerencias[0] && (
                    <div className="space-y-6">
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
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => cambiarPestaña("constancia")}
                      className="inline-flex items-center gap-1 rounded border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                    >
                      ← Volver a constancia oficial
                    </button>
                    <button
                      type="button"
                      onClick={() => cambiarPestaña("resumen")}
                      className="inline-flex items-center gap-1.5 rounded bg-[#b91c1c] px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-[#991b1b] shadow-xs transition"
                    >
                      ↺ Volver al resumen de ocupaciones
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
