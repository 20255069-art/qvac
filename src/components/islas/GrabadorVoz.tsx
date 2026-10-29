import { useEffect, useRef, useState } from "react";

type Props = {
  /** Texto dictado hasta ahora en esta grabación (completo, no solo el último fragmento). */
  onTextoCapturado: (texto: string) => void;
  onGrabando: (grabando: boolean) => void;
};

// El DOM de TypeScript no trae los tipos de SpeechRecognition: solo lo que se usa.
type ReconocedorVoz = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((evento: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
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

const BARRAS = 32;

function mensajeDeError(codigo: string): string {
  if (codigo === "not-allowed" || codigo === "service-not-allowed") {
    return "Permite el micrófono en el navegador para dictar tu respuesta.";
  }
  if (codigo === "network") {
    return "El dictado por voz necesita conexión a internet. Escribe tu respuesta.";
  }
  return "No pudimos escucharte. Intenta de nuevo o escribe tu respuesta.";
}

export default function GrabadorVoz({ onTextoCapturado, onGrabando }: Props) {
  const [grabando, setGrabando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const activo = useRef<{ detener: () => void } | null>(null);
  // Siempre apunta a los callbacks más recientes sin reiniciar la grabación.
  const avisar = useRef({ onTextoCapturado, onGrabando });
  avisar.current = { onTextoCapturado, onGrabando };

  useEffect(() => () => activo.current?.detener(), []);

  async function iniciar() {
    const Voz = constructorVoz();
    if (Voz === undefined || navigator.mediaDevices?.getUserMedia === undefined) {
      setAviso("Tu navegador no permite dictar por voz. Escribe tu respuesta.");
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
    reconocedor.onresult = (evento) => {
      const dictado = Array.from(evento.results, (resultado) => resultado[0]?.transcript ?? "");
      avisar.current.onTextoCapturado(dictado.join(" ").replace(/\s+/g, " ").trim());
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
    // El navegador corta solo tras un silencio largo: también cuenta como detener.
    reconocedor.onend = detener;
    reconocedor.onerror = (evento) => {
      if (evento.error !== "no-speech" && evento.error !== "aborted") {
        setAviso(mensajeDeError(evento.error));
      }
      detener();
    };

    activo.current = { detener };
    reconocedor.start();
    pintar();
    setGrabando(true);
    avisar.current.onGrabando(true);
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-3">
      <button
        type="button"
        aria-pressed={grabando}
        onClick={() => (grabando ? activo.current?.detener() : void iniciar())}
        className="inline-flex min-h-12 items-center gap-2 rounded-base border border-primario bg-fondo px-4 font-semibold text-primario hover:bg-celeste-fondo"
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
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
        </svg>
        {grabando ? "Detener dictado" : "Dictar con voz"}
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
