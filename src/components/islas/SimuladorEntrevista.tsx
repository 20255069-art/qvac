import { useState } from "react";
import type { CompetenciaDetectada } from "../../lib/traductor/tipos.ts";

type Props = {
  detectadas: CompetenciaDetectada[];
  ocupacionNombre: string;
  porcentajeAfinidad: number;
  departamento: string;
};

const FRASES_CONVERSACIONALES: Record<string, string> = {
  C01: "atender con amabilidad y paciencia al público",
  C02: "recibir efectivo y dar vuelto exacto con rapidez",
  C03: "validar cobros por Yape, Plin y POS",
  C04: "hacer el arqueo y cuadre de caja al cierre del turno",
  C05: "registrar ventas y datos en computadora o celular",
  C06: "emitir boletas y facturas verificando cada dato",
  C07: "controlar el stock, kardex y fechas de vencimiento",
  C08: "recepcionar, estibar y despachar mercadería en almacén",
  C09: "mantener el área de trabajo limpia, ordenada y segura",
  C10: "aplicar protocolos de limpieza y desinfección de ambientes",
};

export default function SimuladorEntrevista({
  detectadas,
  ocupacionNombre,
  porcentajeAfinidad,
  departamento,
}: Props) {
  const [copiado, setCopiado] = useState(false);
  const [hablando, setHablando] = useState(false);
  const [mostrarConsejo, setMostrarConsejo] = useState(false);

  const frasesTop = detectadas
    .slice(0, 3)
    .map((d) => FRASES_CONVERSACIONALES[d.id] ?? "resolver tareas operativas del puesto");

  const listaHabilidades =
    frasesTop.length === 1
      ? frasesTop[0]
      : frasesTop.length === 2
        ? `${frasesTop[0]} y ${frasesTop[1]}`
        : `${frasesTop.slice(0, -1).join(", ")} y ${frasesTop[frasesTop.length - 1]}`;

  const discursoPresentacion = `Hola, postulo al puesto vinculado a ${ocupacionNombre} en ${departamento}. En mi trabajo diario ya tengo experiencia práctica en ${listaHabilidades}, alcanzando un ${porcentajeAfinidad}% de compatibilidad con lo que el puesto requiere. Soy una persona puntual, responsable y lista para sumar desde el primer día.`;

  function copiarTexto() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(discursoPresentacion);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }
  }

  function escucharTexto() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }
    if (hablando) {
      window.speechSynthesis.cancel();
      setHablando(false);
      return;
    }
    window.speechSynthesis.cancel();
    const locucion = new SpeechSynthesisUtterance(discursoPresentacion);
    locucion.lang = "es-PE";
    locucion.rate = 0.98;
    locucion.onend = () => setHablando(false);
    locucion.onerror = () => setHablando(false);
    setHablando(true);
    window.speechSynthesis.speak(locucion);
  }

  return (
    <div className="caja mt-6 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-borde pb-3">
        <div>
          <span className="inline-block rounded-full bg-amber-100 px-3 py-0.5 text-xs font-bold text-amber-900">
            🎙️ Entrenador de Entrevista QVAC · Confianza Laboral
          </span>
          <h3 className="mt-1 text-lg font-bold text-texto">
            Cómo presentar tu experiencia con seguridad ante un empleador
          </h3>
        </div>
      </div>

      <p className="mt-2 text-sm text-texto-suave">
        Muchas veces sabemos hacer muy bien el trabajo, pero nos da nervios explicarlo en una
        entrevista. QVAC ha preparado este saludo con tus fortalezas reales para que lo escuches o
        lo envíes por WhatsApp al postular:
      </p>

      <div className="mt-3 rounded-md border-2 border-amber-300/80 bg-amber-50/50 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-amber-900">
          Tu presentación personal lista para decir o enviar:
        </p>
        <blockquote className="mt-1.5 text-base font-medium italic text-texto leading-relaxed">
          «{discursoPresentacion}»
        </blockquote>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={escucharTexto}
            className="inline-flex items-center gap-1.5 rounded-md border border-amber-400 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-amber-950 shadow-xs hover:bg-amber-100"
          >
            {hablando ? "⏹ Detener audio" : "🔊 Escuchar cómo suena con voz"}
          </button>

          <button
            type="button"
            onClick={copiarTexto}
            className="inline-flex items-center gap-1.5 rounded-md bg-primario px-3.5 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-primario-oscuro"
          >
            {copiado ? "✓ ¡Copiado para tu postulación!" : "📋 Copiar para mi CV o WhatsApp"}
          </button>

          <button
            type="button"
            onClick={() => setMostrarConsejo((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-md border border-borde bg-superficie px-3.5 py-2 text-xs sm:text-sm font-semibold text-texto hover:bg-gray-200"
          >
            {mostrarConsejo
              ? "Ocultar consejo de entrevista"
              : "💬 ¿Qué responder si me piden experiencia en planilla?"}
          </button>
        </div>
      </div>

      {mostrarConsejo && (
        <div className="mt-3 rounded-md border border-borde bg-superficie/70 p-4 text-sm space-y-2">
          <p className="font-bold text-texto">
            Pregunta frecuente del empleador: «¿Has trabajado antes en una empresa formal en este
            puesto?»
          </p>
          <p className="text-texto-suave">
            <strong className="text-emerald-800">Respuesta sugerida por QVAC:</strong> «He realizado
            estas mismas tareas todos los días en la práctica —como{" "}
            <span className="font-semibold text-texto">{listaHabilidades}</span>— cumpliendo
            horarios y resolviendo problemas reales. Además, cuento con mi Ficha de Reconversión del
            MTPE y los cursos cortos de{" "}
            <span className="font-semibold text-primario">Capacíta-T</span> para adaptarme rápido a
            los estándares de su empresa.»
          </p>
        </div>
      )}
    </div>
  );
}
