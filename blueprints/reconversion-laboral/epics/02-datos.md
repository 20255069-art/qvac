# Épica 02: Datos del CNPO

> Los 9 perfiles del CNPO están en el repositorio como PDF y texto, y sus ocupaciones, competencias y mapeo con evidencia están validados por esquemas y pruebas de integridad.

| | |
|---|---|
| **Id de épica** | `02-datos` |
| **Tareas** | `E2-T1` (paso 3) · `E2-T2` (paso 4) · `E2-T3` (paso 5) |
| **Depende de** | `01-base` (`E1-T1`: proyecto que compila y pasa `npm run check`) |
| **Desbloquea** | `03-motor` |
| **En paralelo con** | nada: la construcción es secuencial (un agente, una tarea a la vez, en el orden de `tasks.json`) |

No necesitas ningún otro archivo para completar esta épica. Todo lo de abajo se repite aquí a propósito.

---

## Stack

Astro (salida estática) · TypeScript · islas React solo donde hay interacción · Tailwind CSS 4 (CSS-first, `@theme`) · zod · Vitest · Playwright + axe · Biome · sin base de datos · sin autenticación · Cloudflare Pages (subida directa con wrangler).
Gestor de paquetes: `npm`. Node fijado en `.nvmrc` (24). Las versiones exactas están en `package.json` y `package-lock.json`: léelas, nunca adivines una.

Todo se ejecuta desde la raíz del proyecto, en Git Bash. Si `node -v` responde "command not found": `export PATH="/c/Program Files/nodejs:$PATH"` (y, para que dure, la línea de prerrequisitos de `CLAUDE.md`).

| Tarea | Comando |
|---|---|
| Desarrollo | `npm run dev` |
| Construir | `npm run build` |
| Tipos + lint (puerta) | `npm run check` |
| Formatear y autocorregir | `npm run format` |
| Prueba unitaria (un archivo) | `npx vitest run tests/<archivo>.test.ts` |
| Pruebas unitarias (todas, a partir del paso 3) | `npm test` |
| E2E (un archivo) | `npx playwright test e2e/<archivo>.spec.ts` |
| E2E (todas) | `npm run test:e2e` |
| Datos del CNPO | `npm run copiar-perfiles` · `npm run extraer` |
| Servicios locales | ninguno — no hay base de datos ni servicios; Playwright levanta el sitio solo |

**Puerta:** `npm run format && npm run check` en verde, y `npm test` a partir del paso 3 (antes no hay pruebas unitarias y termina con 1 a propósito), antes de marcar cualquier tarea como hecha. La construcción es secuencial. Al empezar cada tarea: `git tag -f inicio-paso-NN`; si sale mal: `git reset --hard inicio-paso-NN`. Ningún `verify` necesita un servicio: el sitio lo construye y lo sirve Playwright con `npm run build && npm run preview` en `http://127.0.0.1:4321`.

## Subárbol de directorios

Solo lo que toca esta épica:

```
scripts/
  copiar-perfiles.mjs        # NUEVO (E2-T1) — copia los 9 PDF del CNPO, omite los existentes
  extraer-texto.mjs          # NUEVO (E2-T1) — PDF → texto con pdfjs-dist
fuentes/
  perfiles/*.pdf             # NUEVO (E2-T1) — 9 PDF, se versionan
  texto/*.txt                # NUEVO (E2-T1) — 9 textos extraídos, se versionan
src/
  lib/esquemas.ts            # NUEVO (E2-T2) — esquemas zod y tipos de todos los datos
  lib/integridad.ts          # NUEVO (E2-T3) — erroresDeIntegridad()
  data/ocupaciones.json      # NUEVO (E2-T2) — 9 ocupaciones con estándares y elementos
  data/competencias.json     # NUEVO (E2-T3) — 30 competencias (contenido literal en la tarea)
  data/mapeo.json            # NUEVO (E2-T3) — ocupación → competencia → ids de elemento
tests/
  extraccion.test.ts         # NUEVO (E2-T1)
  ocupaciones.test.ts        # NUEVO (E2-T2)
  integridad.test.ts         # NUEVO (E2-T3)
```

## Datos que toca

| Entidad | Campos | Notas |
|---|---|---|
| `Ocupacion` (`ocupaciones.json`) | `id`, `codigo`, `nombre`, `nombreCorto`, `puestos[]`, `proposito`, `norma`, `pdf`, `estandares[]`, `demanda{nivel,tipo}` | 9 filas, orden de `ID_OCUPACIONES` |
| `Estandar` | `codigo` (`H2452001-1`), `rol` (`operativo`/`supervisor`), `descripcion`, `elementos[]` | solo los `operativo` alimentan el cálculo |
| `Elemento` | `id` (`H2452001-1-E1`), `texto` | id = `<codigoEstandar>-E<n>` |
| `Competencia` (`competencias.json`) | `id` (`C01`…`C30`), `nombre`, `tipo`, `descripcionSencilla`, `palabrasClave[]` | `C01`–`C25` técnicas, `C26`–`C30` transversales |
| `Mapeo` (`mapeo.json`) | `{ [ocupacionId]: { [competenciaId]: idElemento[] } }` | 6–16 competencias por ocupación, ≥4 técnicas |

## Contratos

**Consumidos:** `npm run check` y `vitest.config.ts` (de `workspace/`), que corre `tests/**/*.test.ts`.

**Producidos:**

| Exporta | Firma | Usado por |
|---|---|---|
| `src/lib/esquemas.ts` | `esquemaOcupaciones`, `esquemaCompetencias`, `esquemaMapeo`, `esquemaCursos`, `esquemaContexto`, `esquemaCurso`, `URL_CAPACITA_T`, `ID_OCUPACIONES`; tipos `Ocupacion`, `Estandar`, `Elemento`, `Competencia`, `Mapeo`, `Curso`, `Cursos`, `Contexto` | `03-motor`, `04-paginas`, `05-entrevista` |
| `src/lib/integridad.ts` | `erroresDeIntegridad(datos: { ocupaciones; competencias; mapeo }): string[]` | `src/lib/datos.ts` (03) |
| `fuentes/texto/<base>.txt` | texto por líneas con `===== fin pag N` | redacción de `mapeo.json`; skill `agregar-ocupacion` |

## Convenciones que muerden aquí

- **Nunca inventes datos.** Todo `nombre`, `proposito`, `norma`, estándar y elemento se copia de `fuentes/texto/`. Un id de elemento que no puedas señalar en el texto no existe.
- Los PDF escriben los códigos de estándar de tres maneras (`H2452001-1`, `G2347002 - 1`, `S3497002 – 1`): en los JSON siempre se normaliza a `G2347002-1`.
- Housekeeping usa el formato 2023 y no numera los elementos: se numeran por orden de aparición dentro de su estándar.
- `palabrasClave` en minúsculas, sin tildes ni eñes (`ninos`, `banos`).
- Los scripts no importan nada de `src/` y no leen `.env`; `PERFILES_ORIGEN` es opcional y tiene valor por defecto.

Reglas completas: `CLAUDE.md`. Reglas de área: `.claude/rules/datos.md`.

---

## Tareas

En el mismo orden que `tasks.json`. Ese orden es el orden de construcción: trabaja de arriba hacia abajo y no reordenes por prioridad ni por lo que parezca rápido.

### `E2-T1` — Copia de perfiles CNPO y extracción de texto

**Depende de:** `E1-T1` · **Prioridad:** p0 — metadato para recortes de alcance, no un orden de ejecución · **Paso de `blueprint.md`:** 3

Antes de empezar: `git tag -f inicio-paso-03` (punto de retorno de esta tarea).

Traer los 9 PDF del CNPO al repositorio y convertirlos en texto, que es la materia prima de los pasos 4 y 5. La capa de datos de este proyecto es el sistema de archivos: no hay servicio que levantar. Ambos scripts usan solo `node:*` y `pdfjs-dist`; nunca importan nada de `src/`.

`scripts/copiar-perfiles.mjs` — copia exactamente 9 archivos (Compras `compras_H2452004.pdf` queda fuera: es un escaneo sin texto), omite los que ya existen y termina con 0; termina con 1 solo si falta un PDF que todavía no está en `fuentes/perfiles/`:

```js
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ORIGEN_POR_DEFECTO = "C:/Users/Home/Pictures/TETHER/innova/perfiles - copia";
const DESTINO = "fuentes/perfiles";
const ARCHIVOS = [
  "almacen_H2452001.pdf",
  "atencion_telefono_M2982001.pdf",
  "caja_comercial_G2347002.pdf",
  "caja_financiera_K2764001.pdf",
  "housekeeping_I2555002.pdf",
  "lavanderia_S3496002.pdf",
  "limpieza_M2981001.pdf",
  "salon_comidas_I2556002.pdf",
  "trabajador_hogar_S3497002.pdf",
];

const origen = process.env.PERFILES_ORIGEN || ORIGEN_POR_DEFECTO;
mkdirSync(DESTINO, { recursive: true });

let faltantes = 0;
for (const archivo of ARCHIVOS) {
  const destino = join(DESTINO, archivo);
  if (existsSync(destino)) {
    console.log(`omitido ${archivo} (ya existe)`);
    continue;
  }
  const fuente = join(origen, archivo);
  if (!existsSync(fuente)) {
    console.error(`falta ${fuente}`);
    faltantes += 1;
    continue;
  }
  copyFileSync(fuente, destino);
  console.log(`copiado ${archivo}`);
}

if (faltantes > 0) {
  console.error(
    `No se pudieron copiar ${faltantes} perfiles. Define PERFILES_ORIGEN con la carpeta de los PDF del CNPO.`,
  );
  process.exit(1);
}
```

`scripts/extraer-texto.mjs` — por cada PDF de `fuentes/perfiles/` escribe `fuentes/texto/<nombre>.txt`, uniendo los fragmentos de texto en una línea mientras la coordenada `y` no cambie más de 2, y agregando `===== fin pag N` al final de cada página (es el método que el 2026-10-24 produjo entre 18 000 y 53 000 caracteres por perfil en esta máquina):

```js
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
```

`tests/extraccion.test.ts`:

```ts
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const PERFILES = [
  ["almacen_H2452001", "H2452001"],
  ["atencion_telefono_M2982001", "M2982001"],
  ["caja_comercial_G2347002", "G2347002"],
  ["caja_financiera_K2764001", "K2764001"],
  ["housekeeping_I2555002", "I2555002"],
  ["lavanderia_S3496002", "S3496002"],
  ["limpieza_M2981001", "M2981001"],
  ["salon_comidas_I2556002", "I2556002"],
  ["trabajador_hogar_S3497002", "S3497002"],
] as const;

describe("extracción de texto de los perfiles del CNPO", () => {
  it("fuentes/perfiles contiene exactamente los 9 PDF esperados", () => {
    const pdfs = readdirSync("fuentes/perfiles")
      .filter((nombre) => nombre.endsWith(".pdf"))
      .sort();
    expect(pdfs).toEqual(PERFILES.map(([base]) => `${base}.pdf`).sort());
  });

  it.each(PERFILES)("%s.txt tiene texto suficiente y su código %s", (base, codigo) => {
    const ruta = `fuentes/texto/${base}.txt`;
    expect(existsSync(ruta)).toBe(true);
    const texto = readFileSync(ruta, "utf8");
    expect(texto.length).toBeGreaterThan(5000);
    expect(texto).toContain(codigo);
    expect(texto).toContain("===== fin pag 1");
  });

  it("no incluye el perfil escaneado de Compras", () => {
    expect(existsSync("fuentes/perfiles/compras_H2452004.pdf")).toBe(false);
    expect(existsSync("fuentes/texto/compras_H2452004.txt")).toBe(false);
  });
});
```

Ejecuta `npm run copiar-perfiles` y `npm run extraer`. Los 9 PDF de `fuentes/perfiles/` y los 9 `.txt` de `fuentes/texto/` **se versionan** (no los excluye ningún patrón de `.gitignore`; `biome.json` sí los excluye del lint con `!!**/fuentes`). `PERFILES_ORIGEN` es opcional: el script trae la ruta de esta máquina por defecto y no lee ningún `.env`. Al final: `npm run format`.

**Archivos**

- `scripts/copiar-perfiles.mjs` — nuevo
- `scripts/extraer-texto.mjs` — nuevo
- `fuentes/perfiles/*.pdf` — nuevo
- `fuentes/texto/*.txt` — nuevo
- `tests/extraccion.test.ts` — nuevo

**Aceptación**

Copiada del arreglo `acceptance` de esta tarea en `tasks.json` — idéntica tras quitar el énfasis markdown. Cada criterio se decide con un comando de abajo, en esta máquina, durante la construcción.

1. **WHEN** `npm run copiar-perfiles` se ejecuta en esta máquina **THE SYSTEM SHALL** dejar en `fuentes/perfiles/` exactamente los 9 PDF de la lista, sin `compras_H2452004.pdf`, y terminar con código 0.
2. **WHEN** `node scripts/copiar-perfiles.mjs` se ejecuta por segunda vez **THE SYSTEM SHALL** imprimir 9 líneas que empiezan con `omitido ` y terminar con código 0 sin sobrescribir ningún archivo.
3. **WHEN** `npm run extraer` se ejecuta **THE SYSTEM SHALL** escribir un `fuentes/texto/<nombre>.txt` por cada PDF y terminar con código 0.
4. **WHEN** `npx vitest run tests/extraccion.test.ts` se ejecuta **THE SYSTEM SHALL** comprobar que cada uno de los 9 `.txt` tiene más de 5000 caracteres, contiene su código de perfil y la marca `===== fin pag 1`, y terminar con código 0.
5. **WHEN** se busca `fuentes/perfiles/compras_H2452004.pdf` **THE SYSTEM SHALL** no encontrarlo.

**Verify** — cada comando, en orden, desde la raíz del proyecto. Cada uno termina con 0 cuando la tarea está bien; la tarea está hecha cuando el último termina con 0.

```bash
npm run copiar-perfiles   # expect: exit 0 — copia los 9 PDF (u omite los que ya están)
test "$(node scripts/copiar-perfiles.mjs | grep -c '^omitido ')" -eq 9   # expect: exit 0 — segunda corrida: los 9 omitidos, nada sobrescrito
npm run extraer   # expect: exit 0 — imprime 9 líneas «fuentes/texto/…: N caracteres»
npx vitest run tests/extraccion.test.ts   # expect: exit 0, 0 fallidas, 0 omitidas
status=0; test -e fuentes/perfiles/compras_H2452004.pdf || status=$?; test "$status" -eq 1   # expect: exit 0 — 1 = el PDF escaneado de Compras no está; 0 (existe) hace fallar la línea
npm run check   # expect: exit 0 — astro check sin errores y biome check sin diagnósticos de error
```

Estas líneas son el arreglo `verify` de esta tarea en `tasks.json`, una por línea, con el envoltorio de código de salida intacto (`status=0; cmd || status=$?; test "$status" -eq N`). No las "limpies".

**Checkpoint**

```bash
git add -A && git commit -m "paso 03: Copia de perfiles CNPO y extracción de texto (E2-T1)" && git tag paso-03
```

Ejecútala después de que el último comando de **Verify** termine con 0 y antes de empezar la siguiente tarea. `paso-03` es el valor `checkpoint` de esta tarea en `tasks.json` y la marca que cuenta §20.1. Si esta tarea sale mal antes de completarse, vuelve con `git reset --hard inicio-paso-03` y reintenta, en lugar de depurar hacia adelante; nunca uses `git reset --hard paso-NN`, que borraría los commits `codex: correcciones etapa …`. Nunca inventes el tag.

### `E2-T2` — Esquemas zod y ocupaciones.json

**Depende de:** `E2-T1` · **Prioridad:** p0 — metadato para recortes de alcance, no un orden de ejecución · **Paso de `blueprint.md`:** 4

Antes de empezar: `git tag -f inicio-paso-04` (punto de retorno de esta tarea).

Fijar el contrato de todos los datos y redactar las 9 ocupaciones a partir del texto extraído en el paso 3.

`src/lib/esquemas.ts` — contenido literal (incluye los esquemas de `cursos.json` y `contexto.json`, que se redactan en el paso 6, para que el contrato exista una sola vez):

```ts
import { z } from "zod";

export const ID_OCUPACIONES = [
  "almacen",
  "atencion_telefonica",
  "caja_comercial",
  "caja_financiera",
  "housekeeping",
  "lavanderia",
  "limpieza",
  "salon_comidas",
  "trabajador_hogar",
] as const;

export const URL_CAPACITA_T = "https://capacitacionlaboral.trabajo.gob.pe/";

export const esquemaElemento = z.object({
  id: z.string().regex(/^[A-Z]\d{7}-\d+-E\d+$/),
  texto: z.string().min(10),
});

export const esquemaEstandar = z.object({
  codigo: z.string().regex(/^[A-Z]\d{7}-\d+$/),
  rol: z.enum(["operativo", "supervisor"]),
  descripcion: z.string().min(10),
  elementos: z.array(esquemaElemento).min(1),
});

export const esquemaOcupacion = z.object({
  id: z.enum(ID_OCUPACIONES),
  codigo: z.string().regex(/^[A-Z]\d{7}$/),
  nombre: z.string().min(3),
  nombreCorto: z.string().min(3),
  puestos: z.array(z.string().min(2)).min(1),
  proposito: z.string().min(20),
  norma: z.string().min(5),
  pdf: z.string().regex(/^fuentes\/perfiles\/[a-z_]+_[A-Z]\d{7}\.pdf$/),
  estandares: z.array(esquemaEstandar).min(1),
  demanda: z.object({
    nivel: z.enum(["alta", "media", "baja"]),
    tipo: z.literal("referencial"),
  }),
});

export const esquemaOcupaciones = z.array(esquemaOcupacion).length(9);

export const esquemaCompetencia = z.object({
  id: z.string().regex(/^C\d{2}$/),
  nombre: z.string().min(3),
  tipo: z.enum(["tecnica", "transversal"]),
  descripcionSencilla: z.string().min(10),
  palabrasClave: z.array(z.string().regex(/^[a-z]+( [a-z]+)*$/)).min(1),
});

export const esquemaCompetencias = z.array(esquemaCompetencia).length(30);

export const esquemaMapeo = z.record(z.string(), z.record(z.string(), z.array(z.string()).min(1)));

export const esquemaCurso = z.object({
  tema: z.string().min(3),
  url: z.literal(URL_CAPACITA_T),
  horasReferenciales: z.number().int().min(4).max(10),
});

export const esquemaCursos = z.record(z.string(), esquemaCurso);

export const esquemaContexto = z.object({
  informalidadNacional: z.number().min(0).max(100),
  periodo: z.string().min(5),
  anterior: z.number().min(0).max(100),
  fuente: z.string().min(10),
});

export type Elemento = z.infer<typeof esquemaElemento>;
export type Estandar = z.infer<typeof esquemaEstandar>;
export type Ocupacion = z.infer<typeof esquemaOcupacion>;
export type Competencia = z.infer<typeof esquemaCompetencia>;
export type Mapeo = z.infer<typeof esquemaMapeo>;
export type Curso = z.infer<typeof esquemaCurso>;
export type Cursos = z.infer<typeof esquemaCursos>;
export type Contexto = z.infer<typeof esquemaContexto>;
```

`src/data/ocupaciones.json` — un arreglo de 9 objetos, **en el orden de `ID_OCUPACIONES`**, redactado leyendo `fuentes/texto/<base>.txt`. Valores fijos por ocupación (la demanda es ilustrativa, decidida por el equipo, no oficial):

| `id` | `codigo` | `nombreCorto` | `pdf` | `demanda.nivel` |
|---|---|---|---|---|
| `almacen` | `H2452001` | `Operario(a) de almacén` | `fuentes/perfiles/almacen_H2452001.pdf` | `alta` |
| `atencion_telefonica` | `M2982001` | `Teleoperador(a)` | `fuentes/perfiles/atencion_telefono_M2982001.pdf` | `alta` |
| `caja_comercial` | `G2347002` | `Cajero(a) de tienda` | `fuentes/perfiles/caja_comercial_G2347002.pdf` | `media` |
| `caja_financiera` | `K2764001` | `Cajero(a) de entidad financiera` | `fuentes/perfiles/caja_financiera_K2764001.pdf` | `media` |
| `housekeeping` | `I2555002` | `Cuartelero(a) de hotel` | `fuentes/perfiles/housekeeping_I2555002.pdf` | `media` |
| `lavanderia` | `S3496002` | `Lavandero(a) y planchador(a)` | `fuentes/perfiles/lavanderia_S3496002.pdf` | `baja` |
| `limpieza` | `M2981001` | `Operario(a) de limpieza` | `fuentes/perfiles/limpieza_M2981001.pdf` | `media` |
| `salon_comidas` | `I2556002` | `Mozo(a) / ayudante de salón` | `fuentes/perfiles/salon_comidas_I2556002.pdf` | `media` |
| `trabajador_hogar` | `S3497002` | `Trabajador(a) del hogar` | `fuentes/perfiles/trabajador_hogar_S3497002.pdf` | `baja` |

`demanda.tipo` es siempre `"referencial"`. Los demás campos se copian del texto extraído, sin inventar nada:

| Campo | De dónde sale en `fuentes/texto/<base>.txt` |
|---|---|
| `nombre` | La línea `Nombre del Perfil Ocupacional: …` (en housekeeping, que usa el formato 2023, la línea `PO: Operaciones de Housekeeping (I2555002)` → `Operaciones de Housekeeping`) |
| `puestos` | La lista de `Otros nombres relacionados al Perfil Ocupacional (cargos, puestos de trabajo)`, separada por comas o barras, sin los puestos de supervisor/jefe/encargado. Si el PDF no la trae, `[nombreCorto]` |
| `proposito` | El párrafo bajo `II. Propósito del Perfil Ocupacional:` (en housekeeping, `Competencia General:`) |
| `norma` | `Norma de aprobación: …` (en housekeeping, `Refrendo: …` hasta la fecha) |
| `estandares[].codigo` | Cada código de estándar de la sección IV (`H2452001-1`). Algunos PDF lo escriben con espacios o raya larga (`G2347002 – 1`): el código se normaliza siempre a `G2347002-1` |
| `estandares[].descripcion` | La descripción del estándar en la sección IV |
| `estandares[].rol` | `supervisor` si la descripción empieza con Supervisar, Organizar, Coordinar, Planificar o Gestionar, o nombra el puesto de supervisor; si no, `operativo` |
| `estandares[].elementos` | Cada `Elemento de Competencia N: <texto>` del estándar → `{ "id": "<codigoEstandar>-E<N>", "texto": "<texto>" }`. Si el PDF no numera los elementos (housekeeping), se numeran por orden de aparición dentro de su estándar, empezando en 1 |

`tests/ocupaciones.test.ts` — importa `src/data/ocupaciones.json` y `../src/lib/esquemas.ts`, lee los `.txt` con `node:fs`, y comprueba:

1. `esquemaOcupaciones.parse` acepta el archivo; los ids son exactamente `ID_OCUPACIONES` en ese orden; `codigo`, `nombreCorto`, `pdf` y `demanda.nivel` coinciden con la tabla de arriba (escrita literal en el test) y `demanda.tipo === "referencial"`.
2. Por cada ocupación: el archivo `pdf` existe; cada `estandares[].codigo` empieza con `<codigo>-`; cada `elementos[].id` es `<codigoEstandar>-E<n>`; hay al menos un estándar `operativo` con al menos un elemento; todo estándar cuya descripción empieza con Supervisar, Organizar, Coordinar, Planificar o Gestionar tiene `rol: "supervisor"`.
3. Cada código de estándar aparece en `fuentes/texto/<base>.txt` (con `<base>` tomado de `pdf`). Se parte el código normalizado (`G2347002-1`) en código de ocupación y número, y se busca con ``new RegExp(`${codigoOcupacion}\\s*[-\\u2013]\\s*${numero}`)``, que acepta `H2452001-1`, `G2347002 - 1` y `G2347002 – 1` (raya U+2013, como la escriben los PDF de caja comercial y trabajador del hogar).
4. `esquemaOcupacion.safeParse` de una copia de la primera ocupación con `estandares[0].rol = "jefe"` devuelve `success: false`.

Al final: `npm run format`.

**Archivos**

- `src/lib/esquemas.ts` — nuevo
- `src/data/ocupaciones.json` — nuevo
- `tests/ocupaciones.test.ts` — nuevo

**Aceptación**

Copiada del arreglo `acceptance` de esta tarea en `tasks.json` — idéntica tras quitar el énfasis markdown. Cada criterio se decide con un comando de abajo, en esta máquina, durante la construcción.

1. **WHEN** `npx vitest run tests/ocupaciones.test.ts` valida `src/data/ocupaciones.json` con `esquemaOcupaciones` **THE SYSTEM SHALL** aceptarlo, con los ids `almacen`, `atencion_telefonica`, `caja_comercial`, `caja_financiera`, `housekeeping`, `lavanderia`, `limpieza`, `salon_comidas` y `trabajador_hogar` en ese orden, cada uno con el `codigo`, el `nombreCorto`, el `pdf` y el `demanda.nivel` de la tabla de ocupaciones y `demanda.tipo` igual a `referencial`.
2. **WHEN** el test recorre los estándares de cada ocupación **THE SYSTEM SHALL** comprobar que cada `codigo` de estándar empieza con `<codigo de la ocupación>-`, que cada elemento tiene id `<codigoEstandar>-E<n>`, que hay al menos un estándar `operativo` con al menos un elemento y que todo estándar cuya descripción empieza con Supervisar, Organizar, Coordinar, Planificar o Gestionar tiene `rol` igual a `supervisor`.
3. **WHEN** el test busca cada código de estándar en `fuentes/texto/<base>.txt` con la expresión `<codigo>\s*[-–]\s*<n>` **THE SYSTEM SHALL** encontrarlo en el texto extraído del PDF de su ocupación.
4. **WHEN** `esquemaOcupacion.safeParse` recibe una ocupación con un estándar de `rol` igual a `jefe` **THE SYSTEM SHALL** devolver `success: false`.
5. **WHEN** `npm run check` se ejecuta **THE SYSTEM SHALL** terminar con código 0.

**Verify** — cada comando, en orden, desde la raíz del proyecto. Cada uno termina con 0 cuando la tarea está bien; la tarea está hecha cuando el último termina con 0.

```bash
npx vitest run tests/ocupaciones.test.ts   # expect: exit 0, 0 fallidas, 0 omitidas
npm run check   # expect: exit 0 — astro check sin errores y biome check sin diagnósticos de error
```

Estas líneas son el arreglo `verify` de esta tarea en `tasks.json`, una por línea, con el envoltorio de código de salida intacto (`status=0; cmd || status=$?; test "$status" -eq N`). No las "limpies".

**Checkpoint**

```bash
git add -A && git commit -m "paso 04: Esquemas zod y ocupaciones.json (E2-T2)" && git tag paso-04
```

Ejecútala después de que el último comando de **Verify** termine con 0 y antes de empezar la siguiente tarea. `paso-04` es el valor `checkpoint` de esta tarea en `tasks.json` y la marca que cuenta §20.1. Si esta tarea sale mal antes de completarse, vuelve con `git reset --hard inicio-paso-04` y reintenta, en lugar de depurar hacia adelante; nunca uses `git reset --hard paso-NN`, que borraría los commits `codex: correcciones etapa …`. Nunca inventes el tag.

### `E2-T3` — Catálogo de competencias y mapeo con evidencia

**Depende de:** `E2-T2` · **Prioridad:** p0 — metadato para recortes de alcance, no un orden de ejecución · **Paso de `blueprint.md`:** 5

Antes de empezar: `git tag -f inicio-paso-05` (punto de retorno de esta tarea).

Crear el catálogo fijo de 30 competencias, el mapeo ocupación → competencias con evidencia del CNPO, y la función que vigila su integridad.

`src/data/competencias.json` — contenido literal (las palabras clave van en minúsculas y sin tildes ni eñes; `C04` incluye `cuadro` para que el relato "cuadro la caja" se reconozca en el paso 12):

```json
[
  {
    "id": "C01",
    "nombre": "Atención al cliente presencial",
    "tipo": "tecnica",
    "descripcionSencilla": "Recibir y atender a las personas en persona con amabilidad: saludar, escuchar y responder sus consultas.",
    "palabrasClave": ["atender", "cliente", "clientes", "publico", "huesped", "comensal", "saludar", "consultas"]
  },
  {
    "id": "C02",
    "nombre": "Manejo y verificación de efectivo",
    "tipo": "tecnica",
    "descripcionSencilla": "Cobrar en efectivo, revisar que los billetes sean buenos y entregar el vuelto exacto.",
    "palabrasClave": ["cobrar", "efectivo", "billetes", "vuelto", "dinero", "sencillo", "monedas"]
  },
  {
    "id": "C03",
    "nombre": "Cobro con medios de pago electrónicos",
    "tipo": "tecnica",
    "descripcionSencilla": "Cobrar con tarjeta, POS, Yape, Plin, QR o transferencia y revisar que el pago se confirme.",
    "palabrasClave": ["pos", "tarjeta", "yape", "plin", "qr", "transferencia", "voucher"]
  },
  {
    "id": "C04",
    "nombre": "Arqueo, cuadre y cierre de caja",
    "tipo": "tecnica",
    "descripcionSencilla": "Contar el dinero al final del turno y comprobar que coincide con lo vendido o registrado.",
    "palabrasClave": ["cuadre", "cuadrar", "cuadro", "arqueo", "cierre de caja", "faltante", "sobrante"]
  },
  {
    "id": "C05",
    "nombre": "Registro de operaciones en sistema informático",
    "tipo": "tecnica",
    "descripcionSencilla": "Anotar ventas, pedidos u operaciones en la computadora o en el sistema de la empresa.",
    "palabrasClave": ["sistema", "registrar", "registro", "computadora", "digitar", "excel"]
  },
  {
    "id": "C06",
    "nombre": "Emisión y control de comprobantes y documentos",
    "tipo": "tecnica",
    "descripcionSencilla": "Entregar boletas, facturas o guías y ordenar los documentos de cada operación.",
    "palabrasClave": ["boleta", "factura", "guia", "comprobante", "recibo", "documentos"]
  },
  {
    "id": "C07",
    "nombre": "Control de inventarios y existencias",
    "tipo": "tecnica",
    "descripcionSencilla": "Contar productos, llevar el control del stock y avisar qué hay que reponer.",
    "palabrasClave": ["inventario", "stock", "conteo", "kardex", "existencias", "reponer"]
  },
  {
    "id": "C08",
    "nombre": "Recepción, almacenamiento y despacho de mercadería",
    "tipo": "tecnica",
    "descripcionSencilla": "Recibir mercadería, guardarla en su lugar y preparar los pedidos que salen.",
    "palabrasClave": ["mercaderia", "almacen", "almacenar", "despachar", "despacho", "pedidos", "recepcion"]
  },
  {
    "id": "C09",
    "nombre": "Orden y organización del área de trabajo",
    "tipo": "tecnica",
    "descripcionSencilla": "Mantener el lugar de trabajo ordenado, con cada cosa en su sitio y clasificada.",
    "palabrasClave": ["ordenar", "organizar", "acomodar", "clasificar", "orden"]
  },
  {
    "id": "C10",
    "nombre": "Limpieza y desinfección de ambientes",
    "tipo": "tecnica",
    "descripcionSencilla": "Limpiar y desinfectar pisos, baños y ambientes siguiendo un orden y un método.",
    "palabrasClave": ["limpiar", "limpieza", "desinfectar", "barrer", "trapear", "banos"]
  },
  {
    "id": "C11",
    "nombre": "Uso seguro de productos químicos de limpieza",
    "tipo": "tecnica",
    "descripcionSencilla": "Usar lejía, detergentes y desinfectantes en la dosis correcta y sin mezclarlos de forma peligrosa.",
    "palabrasClave": ["lejia", "detergente", "quimicos", "desinfectante", "dosificar", "mezclar"]
  },
  {
    "id": "C12",
    "nombre": "Operación y cuidado de equipos y herramientas de trabajo",
    "tipo": "tecnica",
    "descripcionSencilla": "Usar máquinas y herramientas como aspiradoras o lustradoras y mantenerlas en buen estado.",
    "palabrasClave": ["maquina", "equipo", "aspiradora", "lustradora", "herramientas", "mantenimiento"]
  },
  {
    "id": "C13",
    "nombre": "Lavado, secado y planchado de prendas",
    "tipo": "tecnica",
    "descripcionSencilla": "Lavar, secar y planchar ropa según su tela, quitando manchas sin dañarla.",
    "palabrasClave": ["lavar", "lavado", "planchar", "planchado", "secar", "ropa", "prendas", "manchas"]
  },
  {
    "id": "C14",
    "nombre": "Cuidado de ropa blanca y lencería",
    "tipo": "tecnica",
    "descripcionSencilla": "Manejar sábanas, toallas y ropa de cama: contarlas, doblarlas y guardarlas limpias.",
    "palabrasClave": ["sabanas", "toallas", "lenceria", "ropa de cama", "frazadas"]
  },
  {
    "id": "C15",
    "nombre": "Acondicionamiento de habitaciones",
    "tipo": "tecnica",
    "descripcionSencilla": "Preparar habitaciones: tender camas, reponer artículos y dejar todo listo para quien llega.",
    "palabrasClave": ["habitacion", "habitaciones", "tender cama", "camas", "dormitorio", "amenities"]
  },
  {
    "id": "C16",
    "nombre": "Servicio de alimentos y bebidas en mesa",
    "tipo": "tecnica",
    "descripcionSencilla": "Atender mesas: presentar la carta, tomar el pedido y servir platos y bebidas.",
    "palabrasClave": ["mesa", "mesas", "mozo", "servir", "platos", "bebidas", "carta", "comanda"]
  },
  {
    "id": "C17",
    "nombre": "Preparación básica de alimentos",
    "tipo": "tecnica",
    "descripcionSencilla": "Preparar comidas sencillas y menús siguiendo indicaciones.",
    "palabrasClave": ["cocinar", "cocina", "comida", "menu", "preparar", "alimentos"]
  },
  {
    "id": "C18",
    "nombre": "Higiene e inocuidad alimentaria",
    "tipo": "tecnica",
    "descripcionSencilla": "Manipular alimentos con higiene, conservarlos bien y evitar que se contaminen.",
    "palabrasClave": ["manipulacion de alimentos", "inocuidad", "higiene", "refrigeracion", "contaminacion"]
  },
  {
    "id": "C19",
    "nombre": "Atención telefónica y por canales remotos",
    "tipo": "tecnica",
    "descripcionSencilla": "Atender llamadas, chats o WhatsApp y resolver consultas a distancia.",
    "palabrasClave": ["telefono", "llamada", "llamadas", "central", "whatsapp", "chat", "linea"]
  },
  {
    "id": "C20",
    "nombre": "Identificación de necesidades y orientación al usuario",
    "tipo": "tecnica",
    "descripcionSencilla": "Preguntar qué necesita la persona y explicarle con claridad sus opciones.",
    "palabrasClave": ["orientar", "orientacion", "informar", "explicar", "necesidad", "necesidades", "recomendar"]
  },
  {
    "id": "C21",
    "nombre": "Gestión de reclamos y solución de problemas del cliente",
    "tipo": "tecnica",
    "descripcionSencilla": "Escuchar quejas o reclamos y buscar una solución dentro de las reglas de la empresa.",
    "palabrasClave": ["reclamo", "reclamos", "queja", "quejas", "problema", "solucionar", "resolver"]
  },
  {
    "id": "C22",
    "nombre": "Venta y ofrecimiento de productos o servicios",
    "tipo": "tecnica",
    "descripcionSencilla": "Ofrecer productos, promociones o servicios y ayudar al cliente a decidir.",
    "palabrasClave": ["vender", "venta", "ventas", "ofrecer", "promocion", "producto", "productos"]
  },
  {
    "id": "C23",
    "nombre": "Operación de equipos de carga",
    "tipo": "tecnica",
    "descripcionSencilla": "Mover mercadería con transpaleta, carretilla u otro equipo de carga de forma segura.",
    "palabrasClave": ["transpaleta", "montacargas", "estoca", "carretilla", "carga", "descarga"]
  },
  {
    "id": "C24",
    "nombre": "Seguridad y salud en el trabajo y uso de EPP",
    "tipo": "tecnica",
    "descripcionSencilla": "Usar guantes, mascarilla u otro equipo de protección y cuidar tu seguridad y la del equipo.",
    "palabrasClave": ["epp", "guantes", "casco", "seguridad", "accidente", "senalizacion", "mascarilla"]
  },
  {
    "id": "C25",
    "nombre": "Cuidado básico de personas en el hogar",
    "tipo": "tecnica",
    "descripcionSencilla": "Acompañar y cuidar a niños o adultos mayores en sus necesidades diarias.",
    "palabrasClave": ["ninos", "nino", "adulto mayor", "cuidar", "cuidado", "acompanar", "bebe"]
  },
  {
    "id": "C26",
    "nombre": "Comunicación efectiva",
    "tipo": "transversal",
    "descripcionSencilla": "Escuchar y hablar con claridad y buen trato con clientes y compañeros.",
    "palabrasClave": ["comunicar", "conversar", "trato", "amable", "escuchar"]
  },
  {
    "id": "C27",
    "nombre": "Trabajo en equipo",
    "tipo": "transversal",
    "descripcionSencilla": "Coordinar y apoyar a tus compañeros para cumplir las tareas del turno.",
    "palabrasClave": ["equipo", "companeros", "coordinar", "apoyar", "ayudar"]
  },
  {
    "id": "C28",
    "nombre": "Responsabilidad y puntualidad",
    "tipo": "transversal",
    "descripcionSencilla": "Llegar a la hora, cumplir el horario y terminar lo que se te encarga.",
    "palabrasClave": ["puntual", "puntualidad", "responsable", "horario", "cumplir"]
  },
  {
    "id": "C29",
    "nombre": "Trabajo bajo presión",
    "tipo": "transversal",
    "descripcionSencilla": "Mantener la calma y la calidad del trabajo en horas punta o con muchos clientes.",
    "palabrasClave": ["presion", "rapido", "hora punta", "cola", "colas", "muchos clientes", "estres"]
  },
  {
    "id": "C30",
    "nombre": "Atención al detalle y cumplimiento de procedimientos",
    "tipo": "transversal",
    "descripcionSencilla": "Revisar con cuidado y seguir los pasos y protocolos establecidos.",
    "palabrasClave": ["detalle", "revisar", "verificar", "procedimiento", "protocolo", "cuidadoso"]
  }
]
```

`src/data/mapeo.json` — forma `{ "<idOcupacion>": { "<idCompetencia>": ["<idElemento>", …] } }` con las 9 ocupaciones. Se redacta leyendo `fuentes/texto/*.txt` con una sola regla: **la competencia X se mapea a la ocupación O solo si al menos un elemento de un estándar `operativo` de O (su texto, o los criterios de desempeño y conocimientos listados bajo ese elemento) involucra X de forma explícita; se citan los ids de todos esos elementos**. Cada ocupación queda con entre 6 y 16 competencias, al menos 4 técnicas. Las transversales (`C26`–`C30`) pueden salir de criterios o actitudes de elementos operativos. Nunca se citan elementos de estándares `supervisor`. Un fragmento válido de la forma (con ids reales del perfil de almacén) es `{ "almacen": { "C08": ["H2452001-1-E1"] } }`.

`src/lib/integridad.ts` — contenido literal:

```ts
import type { Competencia, Mapeo, Ocupacion } from "./esquemas.ts";

export type DatosIntegridad = {
  ocupaciones: Ocupacion[];
  competencias: Competencia[];
  mapeo: Mapeo;
};

export function erroresDeIntegridad(datos: DatosIntegridad): string[] {
  const errores: string[] = [];
  const tipoPorId = new Map(
    datos.competencias.map((competencia) => [competencia.id, competencia.tipo]),
  );
  const idsOcupaciones = new Set<string>(datos.ocupaciones.map((ocupacion) => ocupacion.id));

  for (const idMapeo of Object.keys(datos.mapeo)) {
    if (!idsOcupaciones.has(idMapeo)) {
      errores.push(`mapeo con ocupación desconocida: ${idMapeo}`);
    }
  }

  for (const ocupacion of datos.ocupaciones) {
    const entrada = datos.mapeo[ocupacion.id];
    if (entrada === undefined) {
      errores.push(`${ocupacion.id}: no tiene entrada en mapeo.json`);
      continue;
    }
    const elementosOperativos = new Set(
      ocupacion.estandares
        .filter((estandar) => estandar.rol === "operativo")
        .flatMap((estandar) => estandar.elementos.map((elemento) => elemento.id)),
    );
    const idsCompetencias = Object.keys(entrada);
    if (idsCompetencias.length < 6 || idsCompetencias.length > 16) {
      errores.push(
        `${ocupacion.id}: tiene ${idsCompetencias.length} competencias (debe tener entre 6 y 16)`,
      );
    }
    const tecnicas = idsCompetencias.filter((id) => tipoPorId.get(id) === "tecnica").length;
    if (tecnicas < 4) {
      errores.push(`${ocupacion.id}: tiene ${tecnicas} competencias técnicas (mínimo 4)`);
    }
    for (const [idCompetencia, evidencias] of Object.entries(entrada)) {
      if (!tipoPorId.has(idCompetencia)) {
        errores.push(`${ocupacion.id}: competencia desconocida ${idCompetencia}`);
      }
      for (const idElemento of evidencias) {
        if (!elementosOperativos.has(idElemento)) {
          errores.push(
            `${ocupacion.id}/${idCompetencia}: el elemento ${idElemento} no existe entre sus estándares operativos`,
          );
        }
      }
    }
  }
  return errores;
}
```

`tests/integridad.test.ts` — importa los tres JSON, los valida con `esquemaOcupaciones`, `esquemaCompetencias` y `esquemaMapeo`, y comprueba:

1. Los ids de competencias son `C01` … `C30` en orden; `C01`–`C25` tienen `tipo: "tecnica"` y `C26`–`C30` `tipo: "transversal"`; toda palabra clave cumple `/^[a-z]+( [a-z]+)*$/`.
2. `erroresDeIntegridad({ ocupaciones, competencias, mapeo })` devuelve `[]`.
3. Por cada una de las 9 ocupaciones, `mapeo[id]` tiene entre 6 y 16 competencias y al menos 4 técnicas (aserción explícita en el test, además de la función).
4. Una copia profunda del mapeo (`structuredClone`) con `"H2452001-99-E99"` agregado a la primera competencia de `almacen` hace que `erroresDeIntegridad` devuelva al menos un error que contiene `H2452001-99-E99`.
5. **Comprobación de sentido con datos reales.** El motor todavía no existe (llega en el paso 7), así que el test define una función local mínima con la misma fórmula de §5: `peso` = 1 si `tipo` es `tecnica` y 0,5 si es `transversal`; con `SA = Object.keys(mapeo[a])` y `SB = Object.keys(mapeo[b])`, `cobertura = Σpeso(SB ∩ SA) / Σpeso(SB)`, `jaccard = Σpeso(SA ∩ SB) / Σpeso(SA ∪ SB)`, `afinidad = (cobertura + jaccard) / 2`. Afirma `afinidad("caja_comercial", "caja_financiera") > afinidad("caja_comercial", "lavanderia")` y `afinidad("limpieza", "housekeeping") > afinidad("limpieza", "atencion_telefonica")`. Si falla, el defecto está en este `mapeo.json` (revisa la evidencia citada contra `fuentes/texto/`); nunca se cambia la fórmula ni el test.

La comprobación de `npm run check` sigue siendo parte del **Verify** de este paso.

Al final: `npm run format`.

**Archivos**

- `src/data/competencias.json` — nuevo
- `src/data/mapeo.json` — nuevo
- `src/lib/integridad.ts` — nuevo
- `tests/integridad.test.ts` — nuevo

**Aceptación**

Copiada del arreglo `acceptance` de esta tarea en `tasks.json` — idéntica tras quitar el énfasis markdown. Cada criterio se decide con un comando de abajo, en esta máquina, durante la construcción.

1. **WHEN** `npx vitest run tests/integridad.test.ts` valida `src/data/competencias.json` **THE SYSTEM SHALL** encontrar las competencias `C01` a `C30` en orden, `C01`–`C25` con `tipo` igual a `tecnica`, `C26`–`C30` con `tipo` igual a `transversal`, y toda palabra clave en minúsculas sin tildes.
2. **WHEN** `erroresDeIntegridad` revisa los datos reales **THE SYSTEM SHALL** devolver una lista vacía: todo id de elemento citado en `mapeo.json` existe entre los estándares `operativo` de esa ocupación y toda competencia citada existe en el catálogo.
3. **WHEN** el test cuenta las competencias de cada una de las 9 ocupaciones en `mapeo.json` **THE SYSTEM SHALL** encontrar entre 6 y 16 por ocupación, con al menos 4 de `tipo` igual a `tecnica`.
4. **WHEN** `erroresDeIntegridad` recibe una copia del mapeo con el id de elemento inexistente `H2452001-99-E99` **THE SYSTEM SHALL** devolver al menos un error que contiene `H2452001-99-E99`.
5. **WHEN** el test calcula la afinidad con la fórmula de pesos (técnica 1, transversal 0,5; promedio de cobertura y Jaccard) sobre `mapeo.json` **THE SYSTEM SHALL** dar a `caja_comercial`→`caja_financiera` más afinidad que a `caja_comercial`→`lavanderia`, y a `limpieza`→`housekeeping` más que a `limpieza`→`atencion_telefonica`.
6. **WHEN** `npm run check` se ejecuta **THE SYSTEM SHALL** terminar con código 0.

**Verify** — cada comando, en orden, desde la raíz del proyecto. Cada uno termina con 0 cuando la tarea está bien; la tarea está hecha cuando el último termina con 0.

```bash
npx vitest run tests/integridad.test.ts   # expect: exit 0, 0 fallidas, 0 omitidas
npx vitest run tests/ocupaciones.test.ts   # expect: exit 0 — la puerta del paso 4 sigue en verde
npm run check   # expect: exit 0 — astro check sin errores y biome check sin diagnósticos de error
```

Estas líneas son el arreglo `verify` de esta tarea en `tasks.json`, una por línea, con el envoltorio de código de salida intacto (`status=0; cmd || status=$?; test "$status" -eq N`). No las "limpies".

**Checkpoint**

```bash
git add -A && git commit -m "paso 05: Catálogo de competencias y mapeo con evidencia (E2-T3)" && git tag paso-05
```

Ejecútala después de que el último comando de **Verify** termine con 0 y antes de empezar la siguiente tarea. `paso-05` es el valor `checkpoint` de esta tarea en `tasks.json` y la marca que cuenta §20.1. Si esta tarea sale mal antes de completarse, vuelve con `git reset --hard inicio-paso-05` y reintenta, en lugar de depurar hacia adelante; nunca uses `git reset --hard paso-NN`, que borraría los commits `codex: correcciones etapa …`. Nunca inventes el tag.

---

## Aceptación de la épica

La épica está hecha cuando todas sus tareas están `done` **y**:

1. **WHEN** `npm test` se ejecuta **THE SYSTEM SHALL** pasar `tests/extraccion.test.ts`, `tests/ocupaciones.test.ts` y `tests/integridad.test.ts` con 0 fallidas.
2. **WHEN** `node scripts/copiar-perfiles.mjs` se vuelve a ejecutar **THE SYSTEM SHALL** omitir los 9 PDF y terminar con código 0.

```bash
npm test                                                                   # expect: exit 0, 0 fallidas
test "$(node scripts/copiar-perfiles.mjs | grep -c '^omitido ')" -eq 9     # expect: exit 0
npm run check                                                              # expect: exit 0
```

## Revisión de la sesión principal antes de la épica 03

El paso 5 (`E2-T3`) exige criterio. Antes de que empiece `E3-T1`, la sesión principal (la que coordina, no el subagente `constructor`) revisa `src/data/mapeo.json`: toma varias competencias por ocupación, abre `fuentes/texto/<base>.txt` y confirma que cada id de elemento citado menciona de verdad esa competencia. Lo dudoso se corrige (o se pide al constructor que lo corrija) en un commit `datos: revisión del mapeo` con `npx vitest run tests/integridad.test.ts` y `npm run check` en verde.

## Trampas

- **Mapeo generoso** — mapear una competencia "porque suena razonable" infla la afinidad y no resiste la pregunta del jurado. Solo con un elemento operativo que la mencione de forma explícita.
- **Estándares de supervisión** — citar un elemento de un estándar `supervisor` hace fallar `erroresDeIntegridad`. Revisa el `rol` antes de citar.
- **`ocupaciones.json` enorme** — es normal (texto de elementos). No lo recortes: `npm run format` lo ordena.

## Antes de seguir

- [ ] Cada tarea de esta épica está `done` en `tasks.json`; ninguna quedó `in_progress`.
- [ ] Pasaron **todos** los comandos `verify` de cada tarea, no solo el primero.
- [ ] Ningún comando `verify` fue editado ni saltado porque un archivo no existía.
- [ ] **Cada tarea tiene su tag de checkpoint en git** (`git tag -l 'paso-*'` los lista), con el valor `checkpoint` de `tasks.json`.
- [ ] `npm run check` pasa limpio desde la raíz del proyecto, con la carpeta `blueprints/` presente.
- [ ] Cada contrato "Producido" de arriba existe con la firma indicada.
- [ ] No se modificó ningún archivo fuera del subárbol de esta épica (salvo el campo `status` de `tasks.json`) ni ninguno de los que trajo `workspace/`.
- [ ] Este proyecto no usa variables en `.env`; si una tarea pareció necesitar una, detente y repórtalo.
- [ ] Un commit por tarea, con el mensaje `paso NN: … (EX-TY)`, seguido de su tag.
- [ ] **Revisión de Codex de la etapa:** al crear el tag de la última tarea, el hook escribió `docs/revisiones-codex/etapa-<epic>.md`. Léelo y corrige los hallazgos de severidad alta o media en un commit `codex: correcciones etapa <epic>` (con `npm run check` en verde, y `npm test` a partir del paso 3) antes de empezar la siguiente épica. Si el informe dice `FALLÓ`, sigue adelante y deja que una persona corra `/codex:review`. No edites el informe.
