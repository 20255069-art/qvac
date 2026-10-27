import { readFileSync } from "node:fs";

const cursos = JSON.parse(readFileSync("src/data/cursos.json", "utf8"));
const urls = [...new Set(Object.values(cursos).map((curso) => curso.url))].sort();

if (process.argv.includes("--solo-listar")) {
  for (const url of urls) {
    console.log(url);
  }
  process.exit(0);
}

async function revisar(url) {
  try {
    const respuesta = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(15000) });
    const correcta = respuesta.status >= 200 && respuesta.status < 400;
    console.log(`${correcta ? "OK" : "ROTO"} ${respuesta.status} ${url}`);
    return correcta;
  } catch (error) {
    const motivo = error instanceof Error ? error.message : String(error);
    console.log(`ROTO sin respuesta ${url}: ${motivo}`);
    return false;
  }
}

const resultados = await Promise.all(urls.map((url) => revisar(url)));
if (resultados.includes(false)) {
  process.exit(1);
}
