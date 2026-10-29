import { useState } from "react";

export type OpcionDilema = {
  id: string;
  texto: string;
  criterioReconocido: string;
  retroalimentacionQvac: string;
  bonoConfianza: number;
};

type EscenarioOcupacion = {
  titulo: string;
  contexto: string;
  opciones: OpcionDilema[];
};

const ESCENARIOS_POR_OCUPACION: Record<string, EscenarioOcupacion> = {
  almacen: {
    titulo: "Situación cotidiana en recepción de mercadería",
    contexto:
      "Llega un proveedor con urgencia en plena hora punta y notas que 3 cajas de productos vienen con la base húmeda y abollada. El transportista te pide que le selles la guía rápido porque tiene que seguir su ruta. ¿Qué harías tú?",
    opciones: [
      {
        id: "alm-a",
        texto:
          "Separo las 3 cajas dañadas, reviso el producto frente a él, anoto la observación en la guía antes de firmar y aviso al encargado.",
        criterioReconocido: "Control de Mermas + Trazabilidad Documental",
        retroalimentacionQvac:
          "¡Excelente criterio logístico! En un almacén formal esto se llama «control de recepción y registro de incidencias». Proteges el inventario de la empresa sin detener la operación.",
        bonoConfianza: 10,
      },
      {
        id: "alm-b",
        texto:
          "Recibo solo las cajas que están en buen estado y le devuelvo en el acto las 3 cajas dañadas corrigiendo la cantidad recibida.",
        criterioReconocido: "Prevención de Pérdidas + Decisión Operativa",
        retroalimentacionQvac:
          "¡Muy buena decisión práctica! Priorizas que no ingrese mercadería en mal estado al stock y mantienes las cuentas claras desde la puerta.",
        bonoConfianza: 8,
      },
      {
        id: "alm-c",
        texto:
          "No recibo nada del pedido hasta que venga el supervisor a revisar toda la carga completa.",
        criterioReconocido: "Prudencia y Cumplimiento de Jerarquía",
        retroalimentacionQvac:
          "Actúas con cautela para evitar errores. Como siguiente paso, anotar qué cajas están sanas y cuáles dañadas agiliza mucho el trabajo del equipo.",
        bonoConfianza: 6,
      },
    ],
  },
  caja_comercial: {
    titulo: "Situación cotidiana en cobro y atención en caja",
    contexto:
      "Hay una fila larga en tu caja. Un cliente paga con Yape y te muestra la pantalla rápido, pero en tu sistema o celular aún no aparece la confirmación del abono y los demás clientes empiezan a impacientarse. ¿Cómo lo manejas?",
    opciones: [
      {
        id: "caj-a",
        texto:
          "Con amabilidad le explico que por seguridad debemos verificar el ingreso del pago con el número de operación, mientras pido apoyo para agilizar la fila.",
        criterioReconocido: "Seguridad de Caja + Comunicación Asertiva bajo Presión",
        retroalimentacionQvac:
          "¡Criterio impecable! Combinas buen trato al cliente con protocolo antifraude y trabajo en equipo para que tu cuadre de cierre salga exacto.",
        bonoConfianza: 10,
      },
      {
        id: "caj-b",
        texto:
          "Reviso con calma la fecha, hora y código de seguridad del comprobante y le ofrezco otro medio de pago si la red está lenta.",
        criterioReconocido: "Verificación de Medios Digitales + Solución de Problemas",
        retroalimentacionQvac:
          "¡Muy bien! Sabes detectar señales de alerta en pagos digitales y das alternativas rápidas sin perder la calma.",
        bonoConfianza: 8,
      },
      {
        id: "caj-c",
        texto:
          "Le pido que espere a un costado hasta que llegue el encargado de tienda para autorizar la entrega.",
        criterioReconocido: "Resguardo de Valores + Prudencia Operativa",
        retroalimentacionQvac:
          "Cuidas el dinero de la caja con responsabilidad y evitas faltantes en el arqueo de turno.",
        bonoConfianza: 6,
      },
    ],
  },
  caja_financiera: {
    titulo: "Situación en ventanilla de operaciones y efectivo",
    contexto:
      "Un usuario se acerca a ventanilla para cambiar efectivo y hacer un depósito grande, pero notas que uno de los billetes de alta denominación tiene una textura extraña y el cliente tiene mucha prisa. ¿Qué haces?",
    opciones: [
      {
        id: "fin-a",
        texto:
          "Aplico el protocolo de revisión (luz UV / marcas de seguridad), le informo con respeto y discreción que ese billete no puede procesarse y registro la operación con el monto válido.",
        criterioReconocido: "Detección de Falsificaciones + Protocolo de Ventanilla",
        retroalimentacionQvac:
          "¡Destacado! Demuestras precisión técnica en custodia de valores y tacto profesional frente al usuario, competencias clave en entidades financieras.",
        bonoConfianza: 10,
      },
      {
        id: "fin-b",
        texto:
          "Separo el billete dudoso, le pido que lo reemplace por otro para completar su operación y verifico dos veces el conteo total.",
        criterioReconocido: "Exactitud en Arqueo + Prevención de Riesgo",
        retroalimentacionQvac:
          "¡Excelente! Mantienes la seguridad del efectivo sin generar conflicto innecesario en la fila.",
        bonoConfianza: 8,
      },
      {
        id: "fin-c",
        texto:
          "Consulto inmediatamente con el supervisor de plataforma antes de validar el depósito.",
        criterioReconocido: "Cumplimiento Normativo y Escalamiento Seguro",
        retroalimentacionQvac:
          "Seguir la cadena de supervisión ante billetes dudosos protege tanto tu caja como a la institución.",
        bonoConfianza: 7,
      },
    ],
  },
  limpieza: {
    titulo: "Situación práctica en limpieza e higiene de ambientes",
    contexto:
      "Debes desinfectar un área de alto tránsito rápido antes de que abran al público. Un compañero nuevo sugiere mezclar lejía con otro limpiador fuerte para «terminar en la mitad de tiempo». ¿Qué haces?",
    opciones: [
      {
        id: "lim-a",
        texto:
          "Le explico con calma que nunca se debe mezclar lejía con otros químicos porque suelta gases tóxicos, usamos la dosis correcta con guantes y señalizamos el piso húmedo.",
        criterioReconocido: "Manejo Seguro de Químicos + Prevención de Accidentes (SST)",
        retroalimentacionQvac:
          "¡Sobresaliente! Cuidas la salud de tu equipo y de los usuarios aplicando normas reales de Seguridad y Salud en el Trabajo.",
        bonoConfianza: 10,
      },
      {
        id: "lim-b",
        texto:
          "Nos dividimos el área en dos zonas usando cada producto por separado y colocamos el cartel de precaución.",
        criterioReconocido: "Trabajo en Equipo + Organización Eficiente",
        retroalimentacionQvac:
          "¡Gran iniciativa! Resuelves la urgencia de tiempo organizando mejor el turno sin poner en riesgo a nadie.",
        bonoConfianza: 8,
      },
      {
        id: "lim-c",
        texto:
          "Reviso las indicaciones del envase primero y uso solo el desinfectante autorizado para pisos.",
        criterioReconocido: "Cumplimiento de Procedimientos e Higiene",
        retroalimentacionQvac:
          "Seguir las instrucciones técnicas del producto asegura una desinfección efectiva sin dañar las superficies.",
        bonoConfianza: 7,
      },
    ],
  },
  housekeeping: {
    titulo: "Situación cotidiana en acondicionamiento de habitaciones",
    contexto:
      "Al preparar una habitación que acaba de desocuparse, encuentras debajo de la almohada un reloj de valor olvidado por el huésped anterior, y en recepción ya están esperando entregar esa habitación. ¿Cómo procedes?",
    opciones: [
      {
        id: "hkp-a",
        texto:
          "Aviso de inmediato a recepción o gobernanta indicando el número de habitación y hora, entrego el objeto bajo registro y termino de acondicionar la habitación impecable.",
        criterioReconocido: "Integridad Profesional + Protocolo de Objetos Olvidados",
        retroalimentacionQvac:
          "¡Excelente! La honradez comprobada y el reporte inmediato son las cualidades más valoradas por hoteles y empresas de hospitalidad.",
        bonoConfianza: 10,
      },
      {
        id: "hkp-b",
        texto:
          "Lo guardo en una bolsa rotulada con el número de cuarto, lo llevo a administración y continúo con el cambio de sábanas y toallas.",
        criterioReconocido: "Orden, Custodia y Estándar de Calidad",
        retroalimentacionQvac:
          "¡Muy bien! Aseguras la trazabilidad del objeto del huésped sin descuidar el ritmo de entrega de habitaciones.",
        bonoConfianza: 9,
      },
      {
        id: "hkp-c",
        texto:
          "Llamo por anexo o celular al encargado del piso para que lo recoja personalmente en la habitación.",
        criterioReconocido: "Comunicación Oportuna y Transparencia",
        retroalimentacionQvac:
          "Comunicar al instante demuestra transparencia y genera total confianza en tu trabajo.",
        bonoConfianza: 7,
      },
    ],
  },
};

const ESCENARIO_GENERICO: EscenarioOcupacion = {
  titulo: "Situación cotidiana de resolución y buen trato",
  contexto:
    "En un momento de mucha carga de trabajo, una persona se acerca molesta porque hubo una demora en su pedido o servicio, aunque el retraso ocurrió en el turno anterior. ¿Qué haces tú?",
  opciones: [
    {
      id: "gen-a",
      texto:
        "La escucho con calma y respeto sin echar culpas, verifico qué falta para resolverlo en ese momento y le doy una respuesta clara.",
      criterioReconocido: "Empatía + Resolución de Reclamos en Tiempo Real",
      retroalimentacionQvac:
        "¡Excelente actitud profesional! Saber escuchar, calmar una situación tensa y enfocarse en la solución es una competencia transversal de altísimo valor.",
      bonoConfianza: 10,
    },
    {
      id: "gen-b",
      texto:
        "Le pido disculpas por la espera, coordino rápido con mis compañeros para darle prioridad y le informo cuántos minutos tomará.",
      criterioReconocido: "Trabajo en Equipo + Comunicación Efectiva",
      retroalimentacionQvac:
        "¡Muy bien! Dar tiempos claros y apoyarte en tu equipo transforma una queja en una buena experiencia.",
      bonoConfianza: 8,
    },
    {
      id: "gen-c",
      texto:
        "Tomo nota de su caso con detalle y lo acompaño con el encargado para darle solución inmediata.",
      criterioReconocido: "Atención al Detalle y Orientación al Usuario",
      retroalimentacionQvac:
        "Atender con amabilidad y canalizar el problema correctamente demuestra responsabilidad y orden.",
      bonoConfianza: 7,
    },
  ],
};

type Props = {
  ocupacionId: string;
  ocupacionNombre: string;
  onDilemaResuelto?: (opcion: OpcionDilema) => void;
};

export default function DilemaSituacional({
  ocupacionId,
  ocupacionNombre,
  onDilemaResuelto,
}: Props) {
  const [seleccionadaId, setSeleccionadaId] = useState<string | null>(null);

  const escenario = ESCENARIOS_POR_OCUPACION[ocupacionId] ?? ESCENARIO_GENERICO;
  const opcionElegida = escenario.opciones.find((o) => o.id === seleccionadaId) ?? null;

  function elegir(opcion: OpcionDilema) {
    setSeleccionadaId(opcion.id);
    onDilemaResuelto?.(opcion);
  }

  return (
    <div className="caja mt-6 border-l-4 border-l-primario bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-primario">
            💡 Paso Opcional Sin Examen · Psicología Ocupacional QVAC
          </span>
          <h3 className="mt-2 text-lg font-bold text-texto">
            Demuestra tu criterio práctico para {ocupacionNombre}
          </h3>
        </div>
        {opcionElegida && (
          <span className="rounded-md bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900">
            ✓ +{opcionElegida.bonoConfianza}% Respaldo Práctico Validado
          </span>
        )}
      </div>

      <p className="mt-1 text-sm text-texto-suave">
        No hay respuestas malas. Elige cómo actuarías según tu experiencia real del día a día:
      </p>

      <div className="mt-3 rounded-md border border-borde bg-superficie/70 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-primario">
          {escenario.titulo}
        </p>
        <p className="mt-1 text-sm sm:text-base font-medium text-texto">{escenario.contexto}</p>
      </div>

      <div className="mt-4 space-y-2.5">
        {escenario.opciones.map((opcion, idx) => {
          const activa = opcion.id === seleccionadaId;
          const letra = String.fromCharCode(65 + idx);
          return (
            <button
              key={opcion.id}
              type="button"
              onClick={() => elegir(opcion)}
              className={`w-full rounded-md border p-3.5 text-left transition-all ${
                activa
                  ? "border-emerald-600 bg-emerald-50/80 shadow-sm ring-1 ring-emerald-500"
                  : "border-borde bg-white hover:border-primario/60 hover:bg-red-50/20"
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    activa ? "bg-emerald-600 text-white" : "bg-superficie text-texto"
                  }`}
                >
                  {activa ? "✓" : letra}
                </span>
                <span className="text-sm sm:text-base font-medium text-texto">{opcion.texto}</span>
              </div>
            </button>
          );
        })}
      </div>

      {opcionElegida && (
        <div className="mt-4 rounded-md border border-emerald-300 bg-emerald-50 p-4 text-emerald-950 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-emerald-800">
              Análisis de Criterio Operativo (QVAC Local-First)
            </span>
            <span className="rounded bg-white px-2 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
              Competencia validada: {opcionElegida.criterioReconocido}
            </span>
          </div>
          <p className="mt-2 text-sm sm:text-base font-medium leading-relaxed">
            {opcionElegida.retroalimentacionQvac}
          </p>
        </div>
      )}
    </div>
  );
}
