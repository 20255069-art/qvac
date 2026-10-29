import { useEffect, useRef, useState } from "react";

type Props = {
  /** Qué respuesta se dicta (p. ej. "respuesta 1"): da un nombre distinto a cada botón. */
  etiqueta: string;
  /** Texto dictado hasta ahora en esta grabación (completo, no solo el último fragmento). */
  onTextoCapturado: (texto: string) => void;
  onGrabando: (grabando: boolean) => void;
  deshabilitado?: boolean;
};

// El DOM de TypeScript no trae los tipos de SpeechRecognition: solo lo que se usa.
type ResultadoVoz = ArrayLike<{ transcript: string }> & { isFinal?: boolean };
type ReconocedorVoz = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((evento: { results: ArrayLike<ResultadoVoz> }) => void) | null;
  onerror: ((evento: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type ConstructorVoz = new () => ReconocedorVoz;

function constructorVoz(): ConstructorVoz | undefined {
  if (typeof window === "undefined") return undefined;
  const ventana = window as unknown as {
    SpeechRecognition?: ConstructorVoz;
    webkitSpeechRecognition?: ConstructorVoz;
  };
  return ventana.SpeechRecognition ?? ventana.webkitSpeechRecognition;
}

const unir = (...trozos: string[]) => trozos.join(" ").replace(/\s+/g, " ").trim();

const BARRAS = 32;

/** null: no es un error para la persona (silencio o parada manual). */
function mensajeDeError(codigo: string): string | null {
  switch (codigo) {
    case "no-speech":
    case "aborted":
      return null;
    case "not-allowed":
    case "service-not-allowed":
      return "Permite el micrófono en tu navegador para dictar tu experiencia.";
    case "audio-capture":
      return "No se detectó un micrófono activo. Puedes escribir tu respuesta en el campo.";
    case "network":
      return "El dictado requiere conexión para procesar voz. Puedes escribir tu respuesta.";
    default:
      return "No pudimos escucharte con claridad. Intenta nuevamente o escribe tu relato.";
  }
}

export default function GrabadorVoz({
  etiqueta,
  onTextoCapturado,
  onGrabando,
  deshabilitado = false,
}: Props) {
  const [soportado, setSoportado] = useState(false);
  const [grabando, setGrabando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const activo = useRef<{ detener: () => void } | null>(null);
  const avisar = useRef({ onTextoCapturado, onGrabando });
  avisar.current = { onTextoCapturado, onGrabando };

  useEffect(() => {
    setSoportado(
      constructorVoz() !== undefined && typeof navigator.mediaDevices?.getUserMedia === "function",
    );
    return () => activo.current?.detener();
  }, []);

  async function iniciar() {
    const Voz = constructorVoz();
    if (Voz === undefined) {
      return;
    }
    setAviso(null);

    let flujo: MediaStream;
    try {
      flujo = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setAviso(mensajeDeError("not-allowed"));
      return;
    }

    const contexto = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    )();
    const analizador = contexto.createAnalyser();
    analizador.fftSize = 128;
    contexto.createMediaStreamSource(flujo).connect(analizador);

    // Onda visual interactiva de altos y bajos con estética institucional roja
    const frecuencias = new Uint8Array(analizador.frequencyBinCount);
    let cuadro = 0;
    const pintar = () => {
      const lienzo = canvas.current;
      const pincel = lienzo?.getContext("2d");
      if (lienzo && pincel) {
        analizador.getByteFrequencyData(frecuencias);
        pincel.clearRect(0, 0, lienzo.width, lienzo.height);

        const ancho = lienzo.width / BARRAS;
        for (let i = 0; i < BARRAS; i += 1) {
          const nivel = (frecuencias[Math.floor((i * frecuencias.length) / BARRAS)] ?? 0) / 255;
          const alto = Math.max(3, nivel * (lienzo.height - 4));

          // Gradiente o color rojo institucional de onda
          pincel.fillStyle = nivel > 0.4 ? "#C90000" : "#E53E3E";
          const x = i * ancho + 1;
          const y = (lienzo.height - alto) / 2;
          pincel.beginPath();
          pincel.roundRect(x, y, ancho - 2, alto, 2);
          pincel.fill();
        }
      }
      cuadro = requestAnimationFrame(pintar);
    };

    const reconocedor = new Voz();
    reconocedor.lang = "es-PE";
    reconocedor.continuous = true;
    reconocedor.interimResults = true;

    let confirmado = "";
    let finalDeSesion = "";
    reconocedor.onresult = (evento) => {
      let final = "";
      let provisional = "";
      for (const resultado of Array.from(evento.results)) {
        const texto = resultado[0]?.transcript ?? "";
        if (resultado.isFinal) {
          final += ` ${texto}`;
        } else {
          provisional += ` ${texto}`;
        }
      }
      finalDeSesion = final;
      avisar.current.onTextoCapturado(unir(confirmado, final, provisional));
    };

    const detener = () => {
      if (activo.current === null) {
        return;
      }
      activo.current = null;
      cancelAnimationFrame(cuadro);
      reconocedor.onend = null;
      reconocedor.onerror = null;
      reconocedor.stop();
      for (const pista of flujo.getTracks()) {
        pista.stop();
      }
      void contexto.close();
      setGrabando(false);
      avisar.current.onGrabando(false);
    };

    reconocedor.onend = () => {
      confirmado = unir(confirmado, finalDeSesion);
      finalDeSesion = "";
      try {
        reconocedor.start();
      } catch {
        detener();
      }
    };

    reconocedor.onerror = (evento) => {
      const mensaje = mensajeDeError(evento.error);
      if (mensaje !== null) {
        setAviso(mensaje);
        detener();
      }
    };

    activo.current = { detener };
    try {
      reconocedor.start();
    } catch {
      setAviso(mensajeDeError("desconocido"));
      detener();
      return;
    }
    pintar();
    setGrabando(true);
    avisar.current.onGrabando(true);
  }

  if (!soportado) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-3">
      <button
        type="button"
        aria-pressed={grabando}
        aria-label={`${grabando ? "Detener dictado de la" : "Dictar por voz la"} ${etiqueta}`}
        disabled={deshabilitado && !grabando}
        onClick={() => (grabando ? activo.current?.detener() : void iniciar())}
        className={`inline-flex min-h-11 items-center gap-2 rounded-md px-3.5 py-1.5 text-sm font-semibold shadow-sm transition-colors ${
          grabando
            ? "border border-red-700 bg-red-700 text-white animate-pulse"
            : "border border-primario bg-fondo text-primario hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        }`}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          {grabando ? (
            <rect x="7" y="7" width="10" height="10" rx="1.5" fill="currentColor" />
          ) : (
            <>
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8" />
            </>
          )}
        </svg>
        <span>{grabando ? "Detener dictado" : "Dictar con voz"}</span>
      </button>

      {grabando && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50/70 px-3 py-1">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
          </span>
          <span className="text-xs font-semibold text-red-700">Grabando audio...</span>
          <canvas
            ref={canvas}
            width={180}
            height={28}
            role="img"
            aria-label="Onda de tu voz mientras dictas"
            className="h-7 w-36 sm:w-44"
          />
        </div>
      )}

      {aviso !== null && (
        <p role="alert" className="w-full text-sm font-medium text-por-fortalecer-texto">
          {aviso}
        </p>
      )}
    </div>
  );
}
