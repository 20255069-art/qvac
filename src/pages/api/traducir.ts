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

export const prerender = false;

// Catálogo de competencias CNPO del MTPE (C01 a C30)
const catalogo = competencias.map(({ id, nombre, descripcionSencilla }) => ({
  id,
  nombre,
  descripcionSencilla,
}));
const idsValidos = new Set(catalogo.map((competencia) => competencia.id));
const promptSistema = construirPromptSistema(catalogo);

/**
 * Lee variables de entorno intentando primero import.meta.env (Astro/Vite)
 * y como fallback process.env (Node SSR).
 */
function leerVariable(nombre: string, porDefecto: string): string {
  const deVite = (import.meta.env as Record<string, string | undefined>)?.[nombre];
  const deProceso = typeof process !== "undefined" ? process.env?.[nombre] : undefined;
  return deVite ?? deProceso ?? porDefecto;
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

  const config = leerConfig();
  try {
    const contenido = await pedirClasificacionQvac(config, promptSistema, relatos.join("\n"));
    const detectadas = interpretarRespuestaQvac(contenido, idsValidos);
    return responderJson({ detectadas, modo: "qvac" }, 200);
  } catch (error) {
    const mensajeError = error instanceof Error ? error.message : String(error);
    console.error("[api/traducir] Error al conectar con QVAC (LLM local / ngrok):", mensajeError, {
      endpoint: config.endpoint,
      modelo: config.modelo,
    });
    return responderJson({ error: "qvac_unavailable", detalle: mensajeError }, 502);
  }
};
