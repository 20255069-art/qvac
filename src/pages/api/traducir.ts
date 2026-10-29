import type { APIRoute } from "astro";
import { competencias } from "../../lib/datos.ts";
import {
  CONFIG_QVAC_POR_DEFECTO,
  type ConfigQvac,
  construirPromptSistema,
  esquemaPeticionTraducir,
  interpretarRespuestaQvac,
  pedirClasificacionQvac,
} from "../../lib/traductor/qvac-protocolo.ts";

// Única ruta bajo demanda del sitio: el resto se prerenderiza (output: "static").
export const prerender = false;

// El catálogo sale de datos.ts (validado con zod al cargar src/data/competencias.json).
// Solo id, nombre y descripción: lo justo para que el modelo clasifique con pocos tokens.
const catalogo = competencias.map(({ id, nombre, descripcionSencilla }) => ({
  id,
  nombre,
  descripcionSencilla,
}));
const idsValidos = new Set(catalogo.map((competencia) => competencia.id));
const promptSistema = construirPromptSistema(catalogo);

/** process.env manda en tiempo de ejecución (servidor Node); import.meta.env cubre `astro dev`. */
function leerVariable(nombre: string, porDefecto: string): string {
  const deProceso = typeof process !== "undefined" ? process.env[nombre] : undefined;
  const deVite = (import.meta.env as Record<string, string | undefined>)[nombre];
  return deProceso ?? deVite ?? porDefecto;
}

function leerConfig(): ConfigQvac {
  return {
    endpoint: leerVariable("QVAC_ENDPOINT", CONFIG_QVAC_POR_DEFECTO.endpoint),
    token: leerVariable("QVAC_TOKEN", CONFIG_QVAC_POR_DEFECTO.token),
    modelo: leerVariable("QVAC_MODEL", CONFIG_QVAC_POR_DEFECTO.modelo),
  };
}

function responderJson(cuerpo: unknown, status: number): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export const POST: APIRoute = async ({ request }) => {
  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return responderJson({ error: "json_invalido" }, 400);
  }

  const peticion = esquemaPeticionTraducir.safeParse(cuerpo);
  if (!peticion.success) {
    return responderJson({ error: "peticion_invalida" }, 400);
  }

  const relatos = peticion.data.relatos.map((relato) => relato.trim()).filter((r) => r !== "");
  if (relatos.length === 0) {
    return responderJson({ items: [], modo: "vacio" }, 200);
  }

  try {
    const contenido = await pedirClasificacionQvac(leerConfig(), promptSistema, relatos.join("\n"));
    const detectadas = interpretarRespuestaQvac(contenido, idsValidos);
    return responderJson({ detectadas, modo: "qvac" }, 200);
  } catch (error) {
    // Nunca se registra el relato: solo el motivo técnico del fallo.
    console.warn(
      "[api/traducir] QVAC no disponible:",
      error instanceof Error ? error.message : error,
    );
    return responderJson({ error: "qvac_unavailable" }, 502);
  }
};
