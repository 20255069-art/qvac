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

// Primero import.meta.env (Astro carga el .env ahí, también en `astro dev`) y después
// process.env (servidor Node en producción). Los accesos son estáticos para que Vite los resuelva.
function leerConfig(): ConfigQvac {
  const proceso = typeof process !== "undefined" ? process.env : {};
  return {
    endpoint:
      import.meta.env.QVAC_ENDPOINT || proceso.QVAC_ENDPOINT || CONFIG_QVAC_POR_DEFECTO.endpoint,
    token: import.meta.env.QVAC_TOKEN || proceso.QVAC_TOKEN || CONFIG_QVAC_POR_DEFECTO.token,
    modelo: import.meta.env.QVAC_MODEL || proceso.QVAC_MODEL || CONFIG_QVAC_POR_DEFECTO.modelo,
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
    // Diagnóstico en la terminal del servidor. Nunca se registra el relato ni el token: solo si hay uno.
    console.error("[api/traducir] QVAC falló, se responde 502 y el cliente usa el respaldo", {
      url: config.endpoint,
      tokenConfigurado: config.token.length > 0,
      mensaje: error instanceof Error ? error.message : String(error),
      causa: error instanceof Error ? error.cause : undefined,
    });
    return responderJson({ error: "qvac_unavailable" }, 502);
  }
};
