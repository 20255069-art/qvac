// Función de Cloudflare Pages: se publica junto al sitio estático y responde en /api/traducir.
// Las variables QVAC_* se configuran en el proyecto de Cloudflare (Settings → Variables and
// Secrets) o, en local con `wrangler pages dev`, en el archivo .dev.vars.
import { competencias } from "../../src/lib/datos.ts";
import {
  CONFIG_QVAC_POR_DEFECTO,
  type ConfigQvac,
  construirPromptSistema,
  esquemaPeticionTraducir,
  interpretarRespuestaQvac,
  pedirClasificacionQvac,
} from "../../src/lib/traductor/qvac-protocolo.ts";

type Entorno = { QVAC_ENDPOINT?: string; QVAC_TOKEN?: string; QVAC_MODEL?: string };

// El catálogo sale de datos.ts (validado con zod al cargar src/data/competencias.json).
// Solo id, nombre y descripción: lo justo para que el modelo clasifique con pocos tokens.
const catalogo = competencias.map(({ id, nombre, descripcionSencilla }) => ({
  id,
  nombre,
  descripcionSencilla,
}));
const idsValidos = new Set(catalogo.map((competencia) => competencia.id));
const promptSistema = construirPromptSistema(catalogo);

function leerConfig(env: Entorno): ConfigQvac {
  return {
    endpoint: env.QVAC_ENDPOINT || CONFIG_QVAC_POR_DEFECTO.endpoint,
    token: env.QVAC_TOKEN || CONFIG_QVAC_POR_DEFECTO.token,
    modelo: env.QVAC_MODEL || CONFIG_QVAC_POR_DEFECTO.modelo,
  };
}

function responderJson(cuerpo: unknown, status: number): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function onRequestPost({
  request,
  env,
}: {
  request: Request;
  env: Entorno;
}): Promise<Response> {
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

  const config = leerConfig(env);
  try {
    const contenido = await pedirClasificacionQvac(config, promptSistema, relatos.join("\n"));
    const detectadas = interpretarRespuestaQvac(contenido, idsValidos);
    return responderJson({ detectadas, modo: "qvac" }, 200);
  } catch (error) {
    // Diagnóstico en los registros de la función. Nunca se registra el relato ni el token: solo si hay uno.
    console.error("[api/traducir] QVAC falló, se responde 502 y el cliente usa el respaldo", {
      url: config.endpoint,
      tokenConfigurado: config.token.length > 0,
      mensaje: error instanceof Error ? error.message : String(error),
      causa: error instanceof Error ? error.cause : undefined,
    });
    return responderJson({ error: "qvac_unavailable" }, 502);
  }
}
