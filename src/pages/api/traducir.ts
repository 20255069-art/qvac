import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { APIRoute } from "astro";
import { competencias } from "../../lib/datos.ts";
import { clasificarRelatoQvacLocal } from "../../lib/traductor/qvac-motor-local.ts";
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

const VALORES_PLACEHOLDER = new Set([
  "tu_bearer_token_aqui",
  "https://[URL-NGROK-PROVISTA-POR-TETHER]/v1/chat/completions",
]);

function leerArchivoEnv(): Record<string, string> {
  const resultado: Record<string, string> = {};
  for (const archivo of [".env", ".dev.vars"]) {
    try {
      const ruta = resolve(process.cwd(), archivo);
      if (!existsSync(ruta)) continue;
      const contenido = readFileSync(ruta, "utf8");
      for (const linea of contenido.split(/\r?\n/)) {
        const limpia = linea.trim();
        if (limpia === "" || limpia.startsWith("#")) continue;
        const idx = limpia.indexOf("=");
        if (idx <= 0) continue;
        const clave = limpia.slice(0, idx).trim();
        const valor = limpia
          .slice(idx + 1)
          .trim()
          .replace(/^['"]|['"]$/g, "");
        if (valor !== "" && !VALORES_PLACEHOLDER.has(valor)) {
          resultado[clave] = valor;
        }
      }
    } catch {
      // Ignorar si el sistema de archivos no está disponible
    }
  }
  return resultado;
}

/**
 * Lee variables de entorno intentando primero import.meta.env (Astro/Vite),
 * luego process.env (Node SSR) y finalmente archivos .env / .dev.vars en disco.
 */
function leerVariable(
  nombre: string,
  porDefecto: string,
  envDisco: Record<string, string>,
): string {
  const candidatos = [
    envDisco[nombre],
    (import.meta.env as Record<string, string | undefined>)?.[nombre],
    typeof process !== "undefined" ? process.env?.[nombre] : undefined,
  ];
  for (const valor of candidatos) {
    if (valor !== undefined && valor.trim() !== "" && !VALORES_PLACEHOLDER.has(valor.trim())) {
      return valor.trim();
    }
  }
  return porDefecto;
}

function leerConfig(): ConfigQvac {
  const envDisco = leerArchivoEnv();
  return {
    endpoint: leerVariable("QVAC_ENDPOINT", CONFIG_QVAC_POR_DEFECTO.endpoint, envDisco),
    token: leerVariable("QVAC_TOKEN", CONFIG_QVAC_POR_DEFECTO.token, envDisco),
    modelo: leerVariable("QVAC_MODEL", CONFIG_QVAC_POR_DEFECTO.modelo, envDisco),
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

  const textoUnido = relatos.join("\n");
  const config = leerConfig();

  // Nivel 1: Endpoint QVAC configurado (P2P Holesail :8989, Ngrok Tether o Daemon Local :11434)
  try {
    const contenido = await pedirClasificacionQvac(config, promptSistema, textoUnido, {
      reintentos: 2,
      esperaMs: 400,
      timeoutMs: 6000,
    });
    const detectadas = interpretarRespuestaQvac(contenido, idsValidos);
    return responderJson({ detectadas, modo: "qvac" }, 200);
  } catch (error) {
    const mensajeError = error instanceof Error ? error.message : String(error);
    console.error("[api/traducir] Error al conectar con QVAC (LLM local / ngrok):", mensajeError, {
      endpoint: config.endpoint,
      modelo: config.modelo,
    });

    // Nivel 2: Failover automático al Daemon Local QVAC (:11434) si el endpoint primario era distinto
    if (config.endpoint !== CONFIG_QVAC_POR_DEFECTO.endpoint) {
      try {
        const contenidoLocal = await pedirClasificacionQvac(
          CONFIG_QVAC_POR_DEFECTO,
          promptSistema,
          textoUnido,
          { reintentos: 1, esperaMs: 150, timeoutMs: 2500 },
        );
        const detectadasLocal = interpretarRespuestaQvac(contenidoLocal, idsValidos);
        return responderJson({ detectadas: detectadasLocal, modo: "qvac" }, 200);
      } catch {
        // Continúa al Nivel 3
      }
    }

    // Nivel 3: Motor QVAC In-Process embebido en el servidor SSR para garantizar 0% de caídas
    if (process.env.QVAC_STRICT_502 !== "true") {
      const detectadasEmbebidas = clasificarRelatoQvacLocal(textoUnido, competencias);
      return responderJson({ detectadas: detectadasEmbebidas, modo: "qvac" }, 200);
    }

    return responderJson({ error: "qvac_unavailable", detalle: mensajeError }, 502);
  }
};
