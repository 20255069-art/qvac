// Hook PostToolUse (Bash) de Claude Code: cuando el comando del agente crea la etiqueta de la
// última tarea de una etapa (epic), pide a Codex una revisión del código de esa etapa.
// Nunca bloquea la construcción: ante cualquier fallo deja constancia y termina con 0.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const RAIZ = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const TAREAS = join(RAIZ, "blueprints", "reconversion-laboral", "tasks.json");
const CARPETA_INFORMES = join(RAIZ, "docs", "revisiones-codex");
const LIMITE_MS = 840000;

function leerEntrada() {
  try {
    return JSON.parse(readFileSync(0, "utf8"));
  } catch {
    return null;
  }
}

function git(argumentos) {
  const resultado = spawnSync("git", argumentos, { cwd: RAIZ, encoding: "utf8" });
  return { ok: resultado.status === 0, salida: (resultado.stdout ?? "").trim() };
}

function lineas(texto) {
  return texto.split(/\r?\n/).filter((linea) => linea.length > 0);
}

function compararVersiones(a, b) {
  const partesA = a.split(".").map(Number);
  const partesB = b.split(".").map(Number);
  for (let i = 0; i < Math.max(partesA.length, partesB.length); i += 1) {
    const diferencia = (partesA[i] ?? 0) - (partesB[i] ?? 0);
    if (diferencia !== 0) {
      return diferencia;
    }
  }
  return 0;
}

function ubicarCompanion() {
  const base = join(homedir(), ".claude", "plugins", "cache", "openai-codex", "codex");
  if (!existsSync(base)) {
    return null;
  }
  const versiones = readdirSync(base)
    .filter((nombre) => /^\d+(\.\d+)*$/.test(nombre))
    .sort(compararVersiones)
    .reverse();
  for (const version of versiones) {
    const ruta = join(base, version, "scripts", "codex-companion.mjs");
    if (existsSync(ruta)) {
      return ruta;
    }
  }
  return null;
}

function avisar(texto) {
  const salida = { hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: texto } };
  process.stdout.write(`${JSON.stringify(salida)}\n`);
}

function escribirInforme(epic, base, comando, resultado, stdout, stderr) {
  mkdirSync(CARPETA_INFORMES, { recursive: true });
  const ruta = join(CARPETA_INFORMES, `etapa-${epic}.md`);
  const contenido = [
    `# Revisión de Codex — etapa ${epic}`,
    "",
    `- Etapa: \`${epic}\``,
    `- Base: \`${base}\``,
    `- Fecha: ${new Date().toISOString()}`,
    `- Comando: \`${comando}\``,
    `- Resultado: ${resultado}`,
    "",
    "## Salida (stdout)",
    "",
    "````text",
    stdout,
    "````",
    "",
    "## Errores (stderr)",
    "",
    "````text",
    stderr,
    "````",
    "",
  ].join("\n");
  writeFileSync(ruta, contenido, "utf8");
  return `docs/revisiones-codex/etapa-${epic}.md`;
}

function principal() {
  const entrada = leerEntrada();
  const comando = entrada?.tool_input?.command;
  if (typeof comando !== "string") {
    return;
  }
  const coincidencia = comando.match(/git tag (paso-\d{2})/);
  if (coincidencia === null || !existsSync(TAREAS)) {
    return;
  }
  const etiqueta = coincidencia[1];
  const tareas = JSON.parse(readFileSync(TAREAS, "utf8"));
  const tarea = tareas.find((candidata) => candidata.checkpoint === etiqueta);
  if (tarea === undefined) {
    return;
  }
  const epic = tarea.epic;
  const existentes = new Set(lineas(git(["tag", "-l"]).salida));
  const cerrada = tareas
    .filter((candidata) => candidata.epic === epic)
    .every((candidata) => existentes.has(candidata.checkpoint));
  const marca = `codex-etapa-${epic}`;
  if (!cerrada || existentes.has(marca)) {
    return;
  }

  const previas = lineas(
    git([
      "for-each-ref",
      "--sort=-creatordate",
      "--format=%(refname:short)",
      "refs/tags/codex-etapa-*",
    ]).salida,
  );
  const base =
    previas[0] ?? lineas(git(["rev-list", "--max-parents=0", "HEAD"]).salida)[0] ?? "HEAD";
  const companion = ubicarCompanion();
  const argumentos = ["review", "--wait", "--base", base, "--scope", "branch", "--cwd", RAIZ];
  const textoComando = `node ${companion ?? "<codex-companion.mjs no encontrado>"} ${argumentos.join(" ")}`;

  let motivo = null;
  let stdout = "";
  let stderr = "";
  if (companion === null) {
    motivo = "no se encontró el plugin codex en ~/.claude/plugins/cache/openai-codex/codex/";
  } else {
    const resultado = spawnSync(process.execPath, [companion, ...argumentos], {
      cwd: RAIZ,
      encoding: "utf8",
      timeout: LIMITE_MS,
      maxBuffer: 64 * 1024 * 1024,
    });
    stdout = resultado.stdout ?? "";
    stderr = resultado.stderr ?? "";
    if (resultado.error !== undefined) {
      motivo = `error al ejecutar Codex: ${resultado.error.message}`;
    } else if (resultado.status !== 0) {
      motivo = `Codex terminó con código ${resultado.status}`;
    }
  }

  const informe = escribirInforme(
    epic,
    base,
    textoComando,
    motivo === null ? "correcta" : `FALLÓ (${motivo})`,
    stdout,
    stderr,
  );
  if (motivo === null) {
    git(["tag", marca]);
    avisar(
      `Revisión de Codex de la etapa ${epic} lista en ${informe}. Léela y corrige los hallazgos de severidad alta o media antes de empezar la siguiente etapa; registra cada corrección en un commit 'codex: correcciones etapa ${epic}'.`,
    );
  } else {
    avisar(
      `La revisión automática de Codex de la etapa ${epic} falló (${motivo}); el detalle está en ${informe}. La construcción sigue: continúa con la siguiente etapa y deja constancia. Una persona puede correr /codex:review a mano más tarde.`,
    );
  }
}

try {
  principal();
} catch (error) {
  const detalle = error instanceof Error ? error.message : String(error);
  avisar(
    `El hook de revisión de Codex tuvo un error inesperado (${detalle}); la construcción sigue. Una persona puede correr /codex:review a mano.`,
  );
}
process.exit(0);
