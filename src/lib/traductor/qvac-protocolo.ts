import { z } from "zod";

/** Lo mínimo que viaja al modelo por competencia: ahorra tokens de contexto. */
export type CompetenciaCatalogo = { id: string; nombre: string; descripcionSencilla: string };

export type DetectadaQvac = { id: string; evidencias: string[] };

export const esquemaPeticionTraducir = z.object({
  relatos: z.array(z.string().max(5000)).max(10),
});

export type ConfigQvac = { endpoint: string; token: string; modelo: string };

export const CONFIG_QVAC_POR_DEFECTO: ConfigQvac = {
  endpoint: "http://127.0.0.1:11434/v1/chat/completions",
  token: "",
  modelo: "qwen-2.5-7b-instruct",
};

export function construirPromptSistema(catalogo: CompetenciaCatalogo[]): string {
  return [
    "Eres un clasificador técnico determinista del MTPE (Perú). Analiza el relato laboral empírico del ciudadano e identifica qué competencias del Catálogo Nacional de Perfiles Ocupacionales (CNPO) demuestra.",
    `Catálogo permitido: ${JSON.stringify(catalogo)}.`,
    "REGLAS ESTRICTAS:",
    "1. Solo puedes elegir IDs que existan exactamente en el catálogo (C01 a C30).",
    "2. Ignora actividades que el usuario mencione que NO sabe hacer o nunca ha hecho.",
    "3. Extrae de 1 a 3 palabras o frases breves literales del relato que sirvan como evidencia por cada competencia detectada.",
    "4. Responde ÚNICAMENTE con un objeto JSON válido, sin markdown ni texto adicional, con esta estructura exacta:",
    '{"detectadas": [{"id": "C01", "evidencias": ["cuadraba caja", "cobraba con yape"]}]}',
  ].join("\n");
}

/** Quita cercas ```json … ``` y texto alrededor del primer objeto JSON. */
export function limpiarContenido(contenido: string): string {
  const sinCercas = contenido.replace(/```(?:json)?/gi, "").trim();
  const inicio = sinCercas.indexOf("{");
  const fin = sinCercas.lastIndexOf("}");
  return inicio >= 0 && fin > inicio ? sinCercas.slice(inicio, fin + 1) : sinCercas;
}

const esquemaRespuestaModelo = z.object({ detectadas: z.array(z.unknown()) });

/**
 * Valida la salida del modelo contra el catálogo real. Los ids inventados o mal formados se
 * descartan uno por uno; si la estructura general no es la esperada, lanza un error.
 */
export function interpretarRespuestaQvac(
  contenido: string,
  idsValidos: ReadonlySet<string>,
): DetectadaQvac[] {
  const crudo = esquemaRespuestaModelo.parse(JSON.parse(limpiarContenido(contenido)));
  const esquemaItem = z.object({
    id: z
      .string()
      .trim()
      .refine((id) => idsValidos.has(id), "id fuera del catálogo CNPO"),
    evidencias: z.array(z.string()).optional().default([]),
  });

  const porId = new Map<string, DetectadaQvac>();
  for (const item of crudo.detectadas) {
    const resultado = esquemaItem.safeParse(item);
    if (!resultado.success || porId.has(resultado.data.id)) {
      continue;
    }
    const evidencias = resultado.data.evidencias
      .map((evidencia) => evidencia.trim())
      .filter((evidencia) => evidencia.length > 0)
      .slice(0, 3);
    porId.set(resultado.data.id, { id: resultado.data.id, evidencias });
  }
  return [...porId.values()].sort((x, y) => x.id.localeCompare(y.id));
}

const esquemaChatCompletion = z.object({
  choices: z.array(z.object({ message: z.object({ content: z.string() }) })).min(1),
});

export type OpcionesPeticion = {
  fetch?: typeof fetch;
  reintentos?: number;
  esperaMs?: number;
  timeoutMs?: number;
};

const esperar = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms));

/** 429 (rate_limit_error) y caídas transitorias del servidor merecen otro intento. */
function esReintentable(estado: number): boolean {
  return estado === 429 || estado === 502 || estado === 503 || estado === 504;
}

/**
 * Llama al endpoint compatible con OpenAI de QVAC. Reintenta hasta `reintentos` veces ante 429,
 * 502/503/504 o error de red, con `esperaMs` entre intentos. Un timeout no se reintenta: un
 * modelo que no responde en `timeoutMs` no suele hacerlo mejor al segundo intento.
 */
export async function pedirClasificacionQvac(
  config: ConfigQvac,
  sistema: string,
  relato: string,
  {
    fetch: hacerFetch = fetch,
    reintentos = 3,
    esperaMs = 1500,
    timeoutMs = 12000,
  }: OpcionesPeticion = {},
): Promise<string> {
  const cabeceras: Record<string, string> = { "Content-Type": "application/json" };
  if (config.token !== "") {
    cabeceras.Authorization = `Bearer ${config.token}`;
  }
  const cuerpo = JSON.stringify({
    model: config.modelo,
    temperature: 0.1,
    messages: [
      { role: "system", content: sistema },
      { role: "user", content: relato },
    ],
  });

  let ultimoError: unknown = null;
  for (let intento = 0; intento <= reintentos; intento += 1) {
    if (intento > 0) {
      await esperar(esperaMs);
    }
    let respuesta: Response;
    try {
      respuesta = await hacerFetch(config.endpoint, {
        method: "POST",
        headers: cabeceras,
        body: cuerpo,
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "TimeoutError") {
        throw error;
      }
      ultimoError = error; // error de red (conexión rechazada, DNS, etc.)
      continue;
    }
    if (respuesta.ok) {
      const json = esquemaChatCompletion.parse(await respuesta.json());
      return json.choices[0]?.message.content ?? "";
    }
    // El cuerpo del error (p. ej. "model not found") dice más que el status solo.
    const detalle = (await respuesta.text().catch(() => "")).slice(0, 300);
    ultimoError = new Error(
      `QVAC respondió ${respuesta.status}${detalle === "" ? "" : `: ${detalle}`}`,
    );
    if (!esReintentable(respuesta.status)) {
      break;
    }
  }
  throw ultimoError ?? new Error("QVAC no respondió");
}
