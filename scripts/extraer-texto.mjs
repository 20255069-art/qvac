import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const ORIGEN = "fuentes/perfiles";
const DESTINO = "fuentes/texto";

async function leerPagina(documento, numero) {
  const pagina = await documento.getPage(numero);
  const contenido = await pagina.getTextContent();
  const lineas = [];
  let linea = "";
  let yAnterior = null;
  for (const item of contenido.items) {
    if (!("str" in item)) {
      continue;
    }
    const y = item.transform[5];
    if (yAnterior !== null && Math.abs(y - yAnterior) > 2) {
      lineas.push(linea.trimEnd());
      linea = "";
    }
    linea += item.str;
    yAnterior = y;
  }
  if (linea.length > 0) {
    lineas.push(linea.trimEnd());
  }
  lineas.push(`===== fin pag ${numero}`);
  return lineas.join("\n");
}

async function extraer(rutaPdf) {
  const datos = new Uint8Array(readFileSync(rutaPdf));
  const tarea = getDocument({ data: datos, verbosity: 0 });
  const documento = await tarea.promise;
  const numeros = Array.from({ length: documento.numPages }, (_, indice) => indice + 1);
  const paginas = await Promise.all(numeros.map((numero) => leerPagina(documento, numero)));
  await tarea.destroy();
  return `${paginas.join("\n")}\n`;
}

const pdfs = readdirSync(ORIGEN).filter((nombre) => nombre.endsWith(".pdf"));
if (pdfs.length === 0) {
  console.error(`No hay PDF en ${ORIGEN}. Ejecuta primero: npm run copiar-perfiles`);
  process.exit(1);
}

mkdirSync(DESTINO, { recursive: true });
const textos = await Promise.all(pdfs.map((nombre) => extraer(join(ORIGEN, nombre))));
for (const [indice, nombre] of pdfs.entries()) {
  const salida = join(DESTINO, `${basename(nombre, ".pdf")}.txt`);
  writeFileSync(salida, textos[indice], "utf8");
  console.log(`${salida}: ${textos[indice].length} caracteres`);
}
