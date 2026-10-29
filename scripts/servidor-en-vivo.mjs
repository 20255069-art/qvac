import { spawn } from "node:child_process";
import { existsSync, watch } from "node:fs";
import { createServer } from "node:http";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { build } from "astro";

const __dirname = dirname(fileURLToPath(import.meta.url));
const raizProyecto = resolve(__dirname, "..");
const rutaQvacDaemon = resolve(__dirname, "qvac-local-server.mjs");
const rutaEntrySsr = resolve(raizProyecto, "dist/server/entry.mjs");
const carpetaSrc = resolve(raizProyecto, "src");

const PUERTO_PUBLICO = 4321;
const PUERTO_INTERNO_SSR = 4322;

let procesoQvac = null;
let procesoSsr = null;
let compilando = false;
let pendienteCompilar = false;

async function verificarSaludQvac() {
  try {
    const res = await fetch("http://127.0.0.1:11434/health", {
      signal: AbortSignal.timeout(1500),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function asegurarQvacActivo() {
  const sano = await verificarSaludQvac();
  if (sano) return;

  if (procesoQvac === null) {
    console.log("[Watchdog QVAC] Levantando daemon local QVAC en 127.0.0.1:11434...");
    procesoQvac = spawn(process.execPath, [rutaQvacDaemon], {
      cwd: raizProyecto,
      stdio: "inherit",
    });
    procesoQvac.on("exit", () => {
      procesoQvac = null;
    });
  }
}

function detenerSsr() {
  return new Promise((resolver) => {
    if (!procesoSsr) {
      resolver(undefined);
      return;
    }
    const proc = procesoSsr;
    procesoSsr = null;
    proc.once("exit", () => resolver(undefined));
    proc.kill();
    setTimeout(() => resolver(undefined), 1500);
  });
}

function iniciarSsr() {
  if (procesoSsr) return;
  procesoSsr = spawn(process.execPath, [rutaEntrySsr], {
    cwd: raizProyecto,
    env: {
      ...process.env,
      HOST: "127.0.0.1",
      PORT: String(PUERTO_INTERNO_SSR),
    },
    stdio: "inherit",
  });
  procesoSsr.on("exit", () => {
    procesoSsr = null;
  });
}

function enviarEnTrozos(res, buffer, tamanoTrozo = 8192) {
  let offset = 0;
  function escribirSiguiente() {
    while (offset < buffer.length) {
      const fin = Math.min(offset + tamanoTrozo, buffer.length);
      const ok = res.write(buffer.subarray(offset, fin));
      offset = fin;
      if (!ok && offset < buffer.length) {
        res.once("drain", escribirSiguiente);
        return;
      }
    }
    res.end();
  }
  escribirSiguiente();
}

// Proxy Gzip + Chunked en el puerto 4321 para que el túnel SSH (localhost.run) entregue
// react-dom/client (~64 KB comprimido en vez de 212 KB) en <100 ms sin bloqueos de buffer.
const proxyPublico = createServer((req, res) => {
  const trozosPeticion = [];
  req.on("data", (c) => trozosPeticion.push(c));
  req.on("end", async () => {
    try {
      const urlDestino = `http://127.0.0.1:${PUERTO_INTERNO_SSR}${req.url || "/"}`;
      const cabeceras = {};
      for (const [k, v] of Object.entries(req.headers)) {
        if (k.toLowerCase() === "host" || k.toLowerCase() === "accept-encoding") continue;
        if (typeof v === "string") cabeceras[k] = v;
      }
      const metodo = req.method || "GET";
      const tieneCuerpo = metodo !== "GET" && metodo !== "HEAD" && trozosPeticion.length > 0;
      const respuestaInterna = await fetch(urlDestino, {
        method: metodo,
        headers: cabeceras,
        body: tieneCuerpo ? Buffer.concat(trozosPeticion) : undefined,
      });

      const tipoContenido = respuestaInterna.headers.get("content-type") || "";
      const cacheControl = respuestaInterna.headers.get("cache-control");
      const rawBuffer = Buffer.from(await respuestaInterna.arrayBuffer());

      const aceptaGzip = String(req.headers["accept-encoding"] || "").includes("gzip");
      const esComprimible = /javascript|json|text|css|svg|xml/i.test(tipoContenido);
      const bufferFinal =
        aceptaGzip && esComprimible && rawBuffer.length > 512
          ? gzipSync(rawBuffer, { level: 6 })
          : rawBuffer;

      const cabecerasSalida = {
        "Content-Type": tipoContenido || "application/octet-stream",
        "Content-Length": String(bufferFinal.length),
      };
      if (cacheControl) cabecerasSalida["Cache-Control"] = cacheControl;
      if (bufferFinal !== rawBuffer) {
        cabecerasSalida["Content-Encoding"] = "gzip";
        cabecerasSalida.Vary = "Accept-Encoding";
      }

      res.writeHead(respuestaInterna.status, cabecerasSalida);
      if (metodo === "HEAD") {
        res.end();
        return;
      }
      enviarEnTrozos(res, bufferFinal);
    } catch {
      res.writeHead(503, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Actualizando servidor en vivo, recarga en 1 segundo...");
    }
  });
});

async function compilarYReiniciar(motivo) {
  if (compilando) {
    pendienteCompilar = true;
    return;
  }
  compilando = true;
  try {
    console.log(`[Auto-Build en Vivo] Recompilando por cambio en ${motivo}...`);
    await detenerSsr();
    await build({ root: raizProyecto });
    iniciarSsr();
    console.log(
      `[Auto-Build en Vivo] ✓ Servidor SSR + Gzip activo en http://127.0.0.1:${PUERTO_PUBLICO}`,
    );
  } catch (err) {
    console.error("[Auto-Build en Vivo] Error al compilar:", err);
    if (existsSync(rutaEntrySsr)) {
      iniciarSsr();
    }
  } finally {
    compilando = false;
    if (pendienteCompilar) {
      pendienteCompilar = false;
      void compilarYReiniciar("cambios acumulados");
    }
  }
}

await asegurarQvacActivo();
setInterval(() => {
  void asegurarQvacActivo();
}, 5000);

proxyPublico.listen(PUERTO_PUBLICO, "127.0.0.1", () => {
  console.log(`[Gateway Gzip] Escuchando en http://127.0.0.1:${PUERTO_PUBLICO}`);
});

if (existsSync(rutaEntrySsr)) {
  iniciarSsr();
} else {
  await compilarYReiniciar("inicio del supervisor");
}

let temporizador = null;
watch(carpetaSrc, { recursive: true }, (_evento, archivo) => {
  if (!archivo) return;
  if (temporizador) clearTimeout(temporizador);
  temporizador = setTimeout(() => {
    void compilarYReiniciar(archivo);
  }, 400);
});

setInterval(() => {}, 60_000);
