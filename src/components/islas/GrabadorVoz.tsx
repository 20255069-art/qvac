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
      return "Permite el micrófono en el navegador para dictar tu respuesta.";
    case "audio-capture":
      return "No encontramos un micrófono. Revisa que esté conectado o escribe tu respuesta.";
    case "network":
      return "El dictado por voz necesita conexión a internet. Escribe tu respuesta.";
    default:
      return "No pudimos escucharte. Intenta de nuevo o escribe tu respuesta.";
  }
}

export default function GrabadorVoz({
  etiqueta,
  onTextoCapturado,
  onGrabando,
  deshabilitado = false,
}: Props) {
  // Se decide tras hidratar: el HTML del servidor no sabe qué permite el navegador.
  const [soportado, setSoportado] = useState(false);
  const [grabando, setGrabando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const activo = useRef<{ detener: () => void } | null>(null);
  // Siempre apunta a los callbacks más recientes sin reiniciar la grabación.
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

    const contexto = new AudioContext();
    const analizador = contexto.createAnalyser();
    analizador.fftSize = 128;
    contexto.createMediaStreamSource(flujo).connect(analizador);

    // Onda de «altos y bajos»: una barra por banda de frecuencia, centrada en vertical.
    const frecuencias = new Uint8Array(analizador.frequencyBinCount);
    let cuadro = 0;
    const pintar = () => {
      const lienzo = canvas.current;
      const pincel = lienzo?.getContext("2d");
      if (lienzo && pincel) {
        analizador.getByteFrequencyData(frecuencias);
        pincel.clearRect(0, 0, lienzo.width, lienzo.height);
        pincel.fillStyle = "currentColor";
        const ancho = lienzo.width / BARRAS;
        for (let i = 0; i < BARRAS; i += 1) {
          const nivel = (frecuencias[Math.floor((i * frecuencias.length) / BARRAS)] ?? 0) / 255;
          const alto = Math.max(3, nivel * lienzo.height);
          pincel.fillRect(i * ancho + 1, (lienzo.height - alto) / 2, ancho - 2, alto);
        }
      }
      cuadro = requestAnimationFrame(pintar);
    };

    const reconocedor = new Voz();
    reconocedor.lang = "es-PE";
    reconocedor.continuous = true;
    reconocedor.interimResults = true;
    // Chrome corta el reconocimiento tras un silencio aunque sea continuo: lo confirmado en
    // sesiones anteriores se guarda y se reinicia mientras la persona no pulse «Detener».
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
        className="inline-flex min-h-12 items-center gap-2 rounded-base border border-primario bg-fondo px-4 font-semibold text-primario hover:bg-celeste-fondo disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg
          width="20"
          height="20"
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
            <rect x="7" y="7" width="10" height="10" rx="1" fill="currentColor" />
          ) : (
            <>
              <rect x="9" y="3" width="6" height="11" rx="3" />
              <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
            </>
          )}
        </svg>
        {grabando ? "Detener" : "Dictar"}
      </button>
      {grabando && (
        <canvas
          ref={canvas}
          width={240}
          height={40}
          role="img"
          aria-label="Onda de tu voz mientras dictas"
          className="h-10 w-full max-w-60 text-primario"
        />
      )}
      {aviso !== null && (
        <p role="alert" className="w-full text-base text-por-fortalecer-texto">
          {aviso}
        </p>
      )}
    </div>
  );
}
