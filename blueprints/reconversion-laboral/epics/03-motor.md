# Épica 03: Datos complementarios y motor de afinidad

> Cada competencia tiene su curso Capacíta-T, el dato de informalidad está cargado y el motor calcula y ordena las 72 transiciones con pruebas a mano y con datos reales.

| | |
|---|---|
| **Id de épica** | `03-motor` |
| **Tareas** | `E3-T1` (paso 6) · `E3-T2` (paso 7) |
| **Depende de** | `02-datos` (esquemas, ocupaciones, competencias, mapeo) |
| **Desbloquea** | `04-paginas`, `05-entrevista` |
| **En paralelo con** | nada: las dos tareas están en serie y todas las épicas siguientes las esperan |

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
src/
  data/cursos.json             # NUEVO (E3-T1) — curso Capacíta-T por competencia (literal)
  data/contexto.json           # NUEVO (E3-T1) — dato de informalidad (literal)
  lib/pesos.ts                 # NUEVO (E3-T2) — peso() y OcupacionMotor
  lib/datos.ts                 # NUEVO (E3-T2) — carga y valida todos los JSON
  lib/afinidad.ts              # NUEVO (E3-T2) — crearMotor, calcularTransicion, ranking
  lib/esquemas.ts              # existe (02), solo lectura
  lib/integridad.ts            # existe (02), solo lectura
scripts/verificar-enlaces.mjs  # NUEVO (E3-T1) — revisa URLs; --solo-listar no usa red
tests/
  complementarios.test.ts      # NUEVO (E3-T1)
  fixtures/datos-minimos.ts    # NUEVO (E3-T2) — conjunto de prueba calculado a mano
  afinidad.test.ts             # NUEVO (E3-T2)
```

## Datos que toca

| Entidad | Campos | Notas |
|---|---|---|
| `Curso` (`cursos.json`) | `tema`, `url`, `horasReferenciales` | una por competencia; `url` siempre `https://capacitacionlaboral.trabajo.gob.pe/` |
| `Contexto` (`contexto.json`) | `informalidadNacional`, `periodo`, `anterior`, `fuente` | 69.8, `abril 2025 – marzo 2026`, 70.7, IEES |
| `Transicion` (calculada, no se guarda) | `origen`, `destino`, `afinidad`, `cobertura`, `jaccard`, `compartidas[]`, `porFortalecer[]` | afinidad redondeada a 3 decimales |

## Contratos

**Consumidos:** `src/lib/esquemas.ts` y `src/lib/integridad.ts` de `02-datos`, con las firmas de su tabla.

**Producidos:**

| Exporta | Firma | Usado por |
|---|---|---|
| `src/lib/datos.ts` | `ocupaciones`, `competencias`, `mapeo`, `cursos`, `contexto` (validados); `ocupacionPorId(id): Ocupacion`; `competenciaPorId(id): Competencia` | `04-paginas`, `05-entrevista` (solo en `.astro`) |
| `src/lib/afinidad.ts` | `crearMotor(datos: DatosMotor)`; `calcularTransicion(origen, destino): Transicion`; `ranking(origen): Transicion[]`; tipos `DatosMotor`, `Transicion`, `Compartida`, `PorFortalecer` | `04-paginas` |
| `src/lib/pesos.ts` | `peso(tipo): 1 \| 0.5`; tipo `OcupacionMotor` | `05-entrevista` |
| `tests/fixtures/datos-minimos.ts` | `datosMinimos: DatosMotor` | `tests/traductor.test.ts` (05) |

## Convenciones que muerden aquí

- **La demanda nunca entra en la fórmula ni en el orden.** El ranking es afinidad → cobertura → `nombreCorto`.
- `datos.ts` es el único archivo de la app que importa los JSON; la isla de la entrevista nunca lo importa (por eso existe `pesos.ts`).
- Esta épica no edita `src/data/`. Las comparaciones de sentido con datos reales viven en el paso 5 (`tests/integridad.test.ts`); si aquí falla una propiedad de los 72 pares por un dato, detente y repórtalo.
- `verificar-enlaces.mjs` sin `--solo-listar` necesita internet: no va en un `Verify`, va en §20.1.

Reglas completas: `CLAUDE.md`. Reglas de área: `.claude/rules/datos.md`.

---

## Tareas

En el mismo orden que `tasks.json`. Ese orden es el orden de construcción: trabaja de arriba hacia abajo y no reordenes por prioridad ni por lo que parezca rápido.

### `E3-T1` — Cursos Capacíta-T, contexto y revisión de enlaces

**Depende de:** `E2-T3` · **Prioridad:** p0 — metadato para recortes de alcance, no un orden de ejecución · **Paso de `blueprint.md`:** 6

Antes de empezar: `git tag -f inicio-paso-06` (punto de retorno de esta tarea).

Completar los datos que el motor (paso 7) y la portada (paso 8) necesitan: el curso público de cada competencia, el dato de informalidad y el script que revisa que los enlaces respondan.

`src/data/cursos.json` — contenido literal. La URL es el portal oficial Capacíta-T del MTPE (respondió HTTP 200 el 2026-10-24); nunca se inventan URLs profundas de cursos, la interfaz dice "Busca el tema «tema» en Capacíta-T (gratuito)". Las horas son referenciales, decididas por el equipo:

```json
{
  "C01": { "tema": "Atención al cliente", "url": "https://capacitacionlaboral.trabajo.gob.pe/", "horasReferenciales": 8 },
  "C02": { "tema": "Manejo de efectivo", "url": "https://capacitacionlaboral.trabajo.gob.pe/", "horasReferenciales": 4 },
  "C03": { "tema": "Medios de pago digitales", "url": "https://capacitacionlaboral.trabajo.gob.pe/", "horasReferenciales": 4 },
  "C04": { "tema": "Cierre y cuadre de caja", "url": "https://capacitacionlaboral.trabajo.gob.pe/", "horasReferenciales": 4 },
  "C05": { "tema": "Ofimática básica", "url": "https://capacitacionlaboral.trabajo.gob.pe/", "horasReferenciales": 10 },
  "C06": { "tema": "Comprobantes de pago", "url": "https://capacitacionlaboral.trabajo.gob.pe/", "horasReferenciales": 4 },
  "C07": { "tema": "Control de inventarios", "url": "https://capacitacionlaboral.trabajo.gob.pe/", "horasReferenciales": 6 },
  "C08": { "tema": "Gestión de almacenes", "url": "https://capacitacionlaboral.trabajo.gob.pe/", "horasReferenciales": 8 },
  "C09": { "tema": "Metodología 5S", "url": "https://capacitacionlaboral.trabajo.gob.pe/", "horasReferenciales": 4 },
  "C10": { "tema": "Limpieza y desinfección", "url": "https://capacitacionlaboral.trabajo.gob.pe/", "horasReferenciales": 6 },
  "C11": { "tema": "Manejo seguro de productos químicos", "url": "https://capacitacionlaboral.trabajo.gob.pe/", "horasReferenciales": 4 },
  "C12": { "tema": "Mantenimiento de equipos", "url": "https://capacitacionlaboral.trabajo.gob.pe/", "horasReferenciales": 6 },
  "C13": { "tema": "Lavandería y planchado", "url": "https://capacitacionlaboral.trabajo.gob.pe/", "horasReferenciales": 6 },
  "C14": { "tema": "Ropa blanca y lencería", "url": "https://capacitacionlaboral.trabajo.gob.pe/", "horasReferenciales": 4 },
  "C15": { "tema": "Housekeeping", "url": "https://capacitacionlaboral.trabajo.gob.pe/", "horasReferenciales": 8 },
  "C16": { "tema": "Atención en salón de comidas", "url": "https://capacitacionlaboral.trabajo.gob.pe/", "horasReferenciales": 8 },
  "C17": { "tema": "Cocina básica", "url": "https://capacitacionlaboral.trabajo.gob.pe/", "horasReferenciales": 10 },
  "C18": { "tema": "Manipulación de alimentos", "url": "https://capacitacionlaboral.trabajo.gob.pe/", "horasReferenciales": 6 },
  "C19": { "tema": "Atención telefónica", "url": "https://capacitacionlaboral.trabajo.gob.pe/", "horasReferenciales": 6 },
  "C20": { "tema": "Orientación al usuario", "url": "https://capacitacionlaboral.trabajo.gob.pe/", "horasReferenciales": 4 },
  "C21": { "tema": "Manejo de reclamos", "url": "https://capacitacionlaboral.trabajo.gob.pe/", "horasReferenciales": 4 },
  "C22": { "tema": "Técnicas de venta", "url": "https://capacitacionlaboral.trabajo.gob.pe/", "horasReferenciales": 8 },
  "C23": { "tema": "Equipos de carga y descarga", "url": "https://capacitacionlaboral.trabajo.gob.pe/", "horasReferenciales": 8 },
  "C24": { "tema": "Seguridad y salud en el trabajo", "url": "https://capacitacionlaboral.trabajo.gob.pe/", "horasReferenciales": 6 },
  "C25": { "tema": "Cuidado de personas", "url": "https://capacitacionlaboral.trabajo.gob.pe/", "horasReferenciales": 10 },
  "C26": { "tema": "Comunicación efectiva", "url": "https://capacitacionlaboral.trabajo.gob.pe/", "horasReferenciales": 4 },
  "C27": { "tema": "Trabajo en equipo", "url": "https://capacitacionlaboral.trabajo.gob.pe/", "horasReferenciales": 4 },
  "C28": { "tema": "Gestión del tiempo", "url": "https://capacitacionlaboral.trabajo.gob.pe/", "horasReferenciales": 4 },
  "C29": { "tema": "Manejo del estrés", "url": "https://capacitacionlaboral.trabajo.gob.pe/", "horasReferenciales": 4 },
  "C30": { "tema": "Calidad y procedimientos", "url": "https://capacitacionlaboral.trabajo.gob.pe/", "horasReferenciales": 4 }
}
```

`src/data/contexto.json` — contenido literal:

```json
{
  "informalidadNacional": 69.8,
  "periodo": "abril 2025 – marzo 2026",
  "anterior": 70.7,
  "fuente": "IEES (Sociedad Nacional de Industrias) con datos INEI-EPEN, Reporte Estadístico Laboral N° 02-2026"
}
```

`scripts/verificar-enlaces.mjs` — contenido literal. Con `--solo-listar` imprime las URL únicas y termina con 0 sin tocar la red (es lo que usa el **Verify**); sin ese argumento pide cada URL con 15 s de límite y termina con 1 si alguna no responde 2xx/3xx (se corre en §20.1, porque necesita red):

```js
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
```

`tests/complementarios.test.ts` — comprueba:

1. `esquemaCursos.parse(cursos)` acepta el archivo; sus claves, ordenadas, son exactamente los ids de `competencias.json`; toda `url` es `URL_CAPACITA_T`; toda `horasReferenciales` es entera entre 4 y 10.
2. `esquemaContexto.parse(contexto)` acepta el archivo, con `informalidadNacional` 69.8, `anterior` 70.7 y `periodo` `"abril 2025 – marzo 2026"`.
3. `esquemaCurso.safeParse({ tema: "Prueba", url: URL_CAPACITA_T, horasReferenciales: 12 }).success` es `false` y `esquemaCurso.safeParse({ tema: "Prueba", url: "https://ejemplo.pe/curso", horasReferenciales: 4 }).success` es `false`.

Al final: `npm run format`.

**Archivos**

- `src/data/cursos.json` — nuevo
- `src/data/contexto.json` — nuevo
- `scripts/verificar-enlaces.mjs` — nuevo
- `tests/complementarios.test.ts` — nuevo

**Aceptación**

Copiada del arreglo `acceptance` de esta tarea en `tasks.json` — idéntica tras quitar el énfasis markdown. Cada criterio se decide con un comando de abajo, en esta máquina, durante la construcción.

1. **WHEN** `npx vitest run tests/complementarios.test.ts` valida `src/data/cursos.json` **THE SYSTEM SHALL** encontrar exactamente una entrada por cada id de `competencias.json`, todas con `url` igual a `https://capacitacionlaboral.trabajo.gob.pe/` y `horasReferenciales` entero entre 4 y 10.
2. **WHEN** el test valida `src/data/contexto.json` con `esquemaContexto` **THE SYSTEM SHALL** aceptarlo con `informalidadNacional` 69.8, `anterior` 70.7 y `periodo` `abril 2025 – marzo 2026`.
3. **WHEN** `esquemaCurso.safeParse` recibe `horasReferenciales: 12` o una `url` distinta del portal Capacíta-T **THE SYSTEM SHALL** devolver `success: false` en ambos casos.
4. **WHEN** `node scripts/verificar-enlaces.mjs --solo-listar` se ejecuta **THE SYSTEM SHALL** imprimir solo la línea `https://capacitacionlaboral.trabajo.gob.pe/` y terminar con código 0 sin usar la red.
5. **WHEN** `npm run check` se ejecuta **THE SYSTEM SHALL** terminar con código 0.

**Verify** — cada comando, en orden, desde la raíz del proyecto. Cada uno termina con 0 cuando la tarea está bien; la tarea está hecha cuando el último termina con 0.

```bash
npx vitest run tests/complementarios.test.ts   # expect: exit 0, 0 fallidas, 0 omitidas
test "$(node scripts/verificar-enlaces.mjs --solo-listar)" = "https://capacitacionlaboral.trabajo.gob.pe/"   # expect: exit 0 — una sola URL única, sin red
npm run check   # expect: exit 0 — astro check sin errores y biome check sin diagnósticos de error
```

Estas líneas son el arreglo `verify` de esta tarea en `tasks.json`, una por línea, con el envoltorio de código de salida intacto (`status=0; cmd || status=$?; test "$status" -eq N`). No las "limpies".

**Checkpoint**

```bash
git add -A && git commit -m "paso 06: Cursos Capacíta-T, contexto y revisión de enlaces (E3-T1)" && git tag paso-06
```

Ejecútala después de que el último comando de **Verify** termine con 0 y antes de empezar la siguiente tarea. `paso-06` es el valor `checkpoint` de esta tarea en `tasks.json` y la marca que cuenta §20.1. Si esta tarea sale mal antes de completarse, vuelve con `git reset --hard inicio-paso-06` y reintenta, en lugar de depurar hacia adelante; nunca uses `git reset --hard paso-NN`, que borraría los commits `codex: correcciones etapa …`. Nunca inventes el tag.

### `E3-T2` — Motor de afinidad con pruebas a mano y reales

**Depende de:** `E3-T1` · **Prioridad:** p0 — metadato para recortes de alcance, no un orden de ejecución · **Paso de `blueprint.md`:** 7

Antes de empezar: `git tag -f inicio-paso-07` (punto de retorno de esta tarea).

Construir el corazón del producto: la carga validada de datos y el cálculo de afinidad entre ocupaciones. Es TypeScript puro, sin Astro ni React, probado con un conjunto mínimo calculado a mano y con los datos reales.

`src/lib/pesos.ts` — contenido literal (módulo diminuto que la isla del paso 13 puede importar sin arrastrar los JSON):

```ts
import type { Competencia } from "./esquemas.ts";

export type OcupacionMotor = { id: string; nombreCorto: string };

export function peso(tipo: Competencia["tipo"]): number {
  return tipo === "tecnica" ? 1 : 0.5;
}
```

`src/lib/datos.ts` — contenido literal. Es el **único** archivo de la app que importa `src/data/*.json`; valida todo al construir y hace fallar `npm run build` si los datos son inconsistentes:

```ts
import competenciasJson from "../data/competencias.json";
import contextoJson from "../data/contexto.json";
import cursosJson from "../data/cursos.json";
import mapeoJson from "../data/mapeo.json";
import ocupacionesJson from "../data/ocupaciones.json";
import {
  type Competencia,
  esquemaCompetencias,
  esquemaContexto,
  esquemaCursos,
  esquemaMapeo,
  esquemaOcupaciones,
  type Ocupacion,
} from "./esquemas.ts";
import { erroresDeIntegridad } from "./integridad.ts";

export const ocupaciones = esquemaOcupaciones.parse(ocupacionesJson);
export const competencias = esquemaCompetencias.parse(competenciasJson);
export const mapeo = esquemaMapeo.parse(mapeoJson);
export const cursos = esquemaCursos.parse(cursosJson);
export const contexto = esquemaContexto.parse(contextoJson);

const errores = erroresDeIntegridad({ ocupaciones, competencias, mapeo });
for (const competencia of competencias) {
  if (cursos[competencia.id] === undefined) {
    errores.push(`cursos.json no tiene curso para ${competencia.id}`);
  }
}
if (errores.length > 0) {
  throw new Error(`Datos inconsistentes:\n${errores.join("\n")}`);
}

export function ocupacionPorId(id: string): Ocupacion {
  const ocupacion = ocupaciones.find((candidata) => candidata.id === id);
  if (ocupacion === undefined) {
    throw new Error(`ocupación desconocida: ${id}`);
  }
  return ocupacion;
}

export function competenciaPorId(id: string): Competencia {
  const competencia = competencias.find((candidata) => candidata.id === id);
  if (competencia === undefined) {
    throw new Error(`competencia desconocida: ${id}`);
  }
  return competencia;
}
```

`src/lib/afinidad.ts` — contenido literal. Fórmula (§5): `peso(c)` = 1 si es técnica y 0,5 si es transversal; para origen A y destino B con conjuntos SA y SB del mapeo, `compartidas = SB ∩ SA`, `porFortalecer = SB \ SA`, `cobertura = Σpeso(compartidas) / Σpeso(SB)`, `jaccard = Σpeso(SA ∩ SB) / Σpeso(SA ∪ SB)`, `afinidad = (cobertura + jaccard) / 2` redondeada a 3 decimales; el ranking ordena por afinidad descendente, luego cobertura descendente, luego `nombreCorto` ascendente con `localeCompare(…, "es")`. **La demanda nunca interviene.**

```ts
import { competencias, cursos, mapeo, ocupaciones } from "./datos.ts";
import type { Competencia, Curso, Cursos, Mapeo } from "./esquemas.ts";
import { type OcupacionMotor, peso } from "./pesos.ts";

export type DatosMotor = {
  ocupaciones: OcupacionMotor[];
  competencias: Competencia[];
  mapeo: Mapeo;
  cursos: Cursos;
};

export type Compartida = {
  competencia: Competencia;
  evidenciaOrigen: string[];
  evidenciaDestino: string[];
};

export type PorFortalecer = {
  competencia: Competencia;
  evidenciaDestino: string[];
  curso: Curso;
};

export type Transicion = {
  origen: string;
  destino: string;
  afinidad: number;
  cobertura: number;
  jaccard: number;
  compartidas: Compartida[];
  porFortalecer: PorFortalecer[];
};

export function crearMotor(datos: DatosMotor) {
  const competenciaPorId = new Map(
    datos.competencias.map((competencia) => [competencia.id, competencia]),
  );
  const nombrePorId = new Map(
    datos.ocupaciones.map((ocupacion) => [ocupacion.id, ocupacion.nombreCorto]),
  );

  function conjunto(idOcupacion: string): Record<string, string[]> {
    const entrada = datos.mapeo[idOcupacion];
    if (!nombrePorId.has(idOcupacion) || entrada === undefined) {
      throw new Error(`ocupación desconocida: ${idOcupacion}`);
    }
    return entrada;
  }

  function competencia(id: string): Competencia {
    const encontrada = competenciaPorId.get(id);
    if (encontrada === undefined) {
      throw new Error(`competencia desconocida: ${id}`);
    }
    return encontrada;
  }

  function sumaPesos(ids: Iterable<string>): number {
    let total = 0;
    for (const id of ids) {
      total += peso(competencia(id).tipo);
    }
    return total;
  }

  function calcularTransicion(origen: string, destino: string): Transicion {
    if (origen === destino) {
      throw new Error("origen y destino deben ser distintos");
    }
    const sa = conjunto(origen);
    const sb = conjunto(destino);
    const idsA = new Set(Object.keys(sa));
    const idsB = Object.keys(sb).sort();
    const idsCompartidas = idsB.filter((id) => idsA.has(id));
    const idsPorFortalecer = idsB.filter((id) => !idsA.has(id));
    const pesoInterseccion = sumaPesos(idsCompartidas);
    const pesoDestino = sumaPesos(idsB);
    const pesoUnion = sumaPesos(new Set([...idsA, ...idsB]));
    const cobertura = pesoDestino === 0 ? 0 : pesoInterseccion / pesoDestino;
    const jaccard = pesoUnion === 0 ? 0 : pesoInterseccion / pesoUnion;
    return {
      origen,
      destino,
      afinidad: Math.round(((cobertura + jaccard) / 2) * 1000) / 1000,
      cobertura,
      jaccard,
      compartidas: idsCompartidas.map((id) => ({
        competencia: competencia(id),
        evidenciaOrigen: sa[id] ?? [],
        evidenciaDestino: sb[id] ?? [],
      })),
      porFortalecer: idsPorFortalecer.map((id) => {
        const curso = datos.cursos[id];
        if (curso === undefined) {
          throw new Error(`sin curso para ${id}`);
        }
        return { competencia: competencia(id), evidenciaDestino: sb[id] ?? [], curso };
      }),
    };
  }

  function ranking(origen: string): Transicion[] {
    conjunto(origen);
    return datos.ocupaciones
      .filter((ocupacion) => ocupacion.id !== origen)
      .map((ocupacion) => calcularTransicion(origen, ocupacion.id))
      .sort(
        (x, y) =>
          y.afinidad - x.afinidad ||
          y.cobertura - x.cobertura ||
          (nombrePorId.get(x.destino) ?? "").localeCompare(nombrePorId.get(y.destino) ?? "", "es"),
      );
  }

  return { calcularTransicion, ranking };
}

const motor = crearMotor({ ocupaciones, competencias, mapeo, cursos });

export const calcularTransicion = motor.calcularTransicion;
export const ranking = motor.ranking;
```

`tests/fixtures/datos-minimos.ts` — contenido literal (conjunto de prueba calculado a mano; lo reutiliza el paso 12):

```ts
import type { DatosMotor } from "../../src/lib/afinidad.ts";
import { type Curso, URL_CAPACITA_T } from "../../src/lib/esquemas.ts";

function curso(tema: string): Curso {
  return { tema, url: URL_CAPACITA_T, horasReferenciales: 4 };
}

export const datosMinimos: DatosMotor = {
  ocupaciones: [
    { id: "a", nombreCorto: "Delta" },
    { id: "b", nombreCorto: "Zeta" },
    { id: "c", nombreCorto: "Beta" },
    { id: "d", nombreCorto: "Alfa" },
  ],
  competencias: [
    {
      id: "C01",
      nombre: "Técnica uno",
      tipo: "tecnica",
      descripcionSencilla: "Competencia técnica de prueba uno.",
      palabrasClave: ["uno"],
    },
    {
      id: "C02",
      nombre: "Técnica dos",
      tipo: "tecnica",
      descripcionSencilla: "Competencia técnica de prueba dos.",
      palabrasClave: ["dos"],
    },
    {
      id: "C03",
      nombre: "Técnica tres",
      tipo: "tecnica",
      descripcionSencilla: "Competencia técnica de prueba tres.",
      palabrasClave: ["tres"],
    },
    {
      id: "C26",
      nombre: "Transversal",
      tipo: "transversal",
      descripcionSencilla: "Competencia transversal de prueba.",
      palabrasClave: ["cuatro"],
    },
  ],
  mapeo: {
    a: { C01: ["A-1-E1"], C02: ["A-1-E2"], C26: ["A-1-E1"] },
    b: { C02: ["B-1-E1"], C03: ["B-1-E2"], C26: ["B-1-E1"] },
    c: { C01: ["C-1-E1"] },
    d: { C01: ["D-1-E1"] },
  },
  cursos: {
    C01: curso("Tema uno"),
    C02: curso("Tema dos"),
    C03: curso("Tema tres"),
    C26: curso("Tema cuatro"),
  },
};
```

Valores calculados a mano para ese conjunto (los usa el test; cobertura y jaccard no se redondean, solo afinidad):

| Llamada | cobertura | jaccard | afinidad | compartidas | porFortalecer |
|---|---|---|---|---|---|
| `calcularTransicion("a", "b")` | 0.6 (= 1,5 / 2,5) | 0.428571… (= 1,5 / 3,5) | 0.514 | `C02`, `C26` | `C03` |
| `calcularTransicion("a", "c")` | 1 | 0.4 (= 1 / 2,5) | 0.7 | `C01` | ninguna |
| `calcularTransicion("c", "a")` | 0.4 | 0.4 | 0.4 | `C01` | `C02`, `C26` |
| `ranking("a")` destinos | — | — | `d` 0.7, `c` 0.7, `b` 0.514 | — | — |

`tests/afinidad.test.ts` — usa `crearMotor(datosMinimos)` y las funciones `calcularTransicion` / `ranking` ligadas a los datos reales, y comprueba:

1. Las tres transiciones de la tabla con `toBeCloseTo(valor, 6)` para cobertura y jaccard, `toBe` para afinidad, y los ids de `compartidas` y `porFortalecer` en ese orden; `porFortalecer[0].curso.tema` de `a`→`b` es `"Tema tres"`; la evidencia de `C02` en `a`→`b` es `["A-1-E2"]` (origen) y `["B-1-E1"]` (destino).
2. `ranking("a").map((t) => t.destino)` es `["d", "c", "b"]`.
3. Para cada par ordenado distinto de las 9 ocupaciones reales (los 72 pares): la unión de ids de `compartidas` y `porFortalecer` es igual a `Object.keys(mapeo[destino])`, no comparten ids, y `afinidad`, `cobertura` y `jaccard` están entre 0 y 1.
4. Para cada una de las 9 ocupaciones reales, `ranking(id)` tiene longitud 8, no contiene `id` y sus `afinidad` están en orden no creciente. (Las comparaciones de sentido entre ocupaciones reales ya las fija el paso 5.)
5. `calcularTransicion("caja_comercial", "caja_comercial")` lanza `Error` con mensaje `origen y destino deben ser distintos` y `calcularTransicion("caja_comercial", "no_existe")` lanza `Error` con mensaje `ocupación desconocida: no_existe`.

Este paso no edita `src/data/`: si un dato real hace fallar el punto 3, detente y repórtalo como defecto del paso 5. Al final: `npm run format`.

**Archivos**

- `src/lib/pesos.ts` — nuevo
- `src/lib/datos.ts` — nuevo
- `src/lib/afinidad.ts` — nuevo
- `tests/fixtures/datos-minimos.ts` — nuevo
- `tests/afinidad.test.ts` — nuevo

**Aceptación**

Copiada del arreglo `acceptance` de esta tarea en `tasks.json` — idéntica tras quitar el énfasis markdown. Cada criterio se decide con un comando de abajo, en esta máquina, durante la construcción.

1. **WHEN** `npx vitest run tests/afinidad.test.ts` calcula `a`→`b` con `crearMotor(datosMinimos)` **THE SYSTEM SHALL** devolver `cobertura` 0.6, `jaccard` 0.428571 con 6 decimales, `afinidad` 0.514, compartidas `C02` y `C26`, y por fortalecer `C03` con el curso `Tema tres`.
2. **WHEN** el test pide `ranking("a")` en el conjunto mínimo **THE SYSTEM SHALL** devolver los destinos `d`, `c`, `b` en ese orden, con el empate de afinidad 0.7 y cobertura 1 resuelto por `nombreCorto` (`Alfa` antes que `Beta`).
3. **WHEN** el test recorre los 72 pares ordenados de las 9 ocupaciones reales **THE SYSTEM SHALL** cumplir en cada uno que los ids de compartidas y por fortalecer, unidos, son exactamente las competencias del destino en `mapeo.json`, que no se repiten entre ambas listas, y que `afinidad`, `cobertura` y `jaccard` están entre 0 y 1.
4. **WHEN** el test pide `ranking` para cada una de las 9 ocupaciones reales **THE SYSTEM SHALL** devolver 8 destinos sin el origen, ordenados por afinidad no creciente.
5. **WHEN** `calcularTransicion` recibe el mismo id como origen y destino, o el id desconocido `no_existe` **THE SYSTEM SHALL** lanzar un `Error` con el mensaje `origen y destino deben ser distintos` o `ocupación desconocida: no_existe`, respectivamente.
6. **WHEN** `npm run check` y `npm test` se ejecutan **THE SYSTEM SHALL** terminar ambos con código 0.

**Verify** — cada comando, en orden, desde la raíz del proyecto. Cada uno termina con 0 cuando la tarea está bien; la tarea está hecha cuando el último termina con 0.

```bash
npx vitest run tests/afinidad.test.ts   # expect: exit 0, 0 fallidas, 0 omitidas
npm test   # expect: exit 0 — todas las pruebas unitarias de los pasos 3 a 7
npm run check   # expect: exit 0 — astro check sin errores y biome check sin diagnósticos de error
```

Estas líneas son el arreglo `verify` de esta tarea en `tasks.json`, una por línea, con el envoltorio de código de salida intacto (`status=0; cmd || status=$?; test "$status" -eq N`). No las "limpies".

**Checkpoint**

```bash
git add -A && git commit -m "paso 07: Motor de afinidad con pruebas a mano y reales (E3-T2)" && git tag paso-07
```

Ejecútala después de que el último comando de **Verify** termine con 0 y antes de empezar la siguiente tarea. `paso-07` es el valor `checkpoint` de esta tarea en `tasks.json` y la marca que cuenta §20.1. Si esta tarea sale mal antes de completarse, vuelve con `git reset --hard inicio-paso-07` y reintenta, en lugar de depurar hacia adelante; nunca uses `git reset --hard paso-NN`, que borraría los commits `codex: correcciones etapa …`. Nunca inventes el tag.

---

## Aceptación de la épica

La épica está hecha cuando todas sus tareas están `done` **y**:

1. **WHEN** `npm test` se ejecuta **THE SYSTEM SHALL** pasar todas las pruebas unitarias de los pasos 3 a 7 con 0 fallidas.
2. **WHEN** `npx vitest run tests/afinidad.test.ts` se ejecuta **THE SYSTEM SHALL** cumplir las propiedades de los 72 pares reales y los valores del conjunto mínimo calculados a mano.

```bash
npm test                                  # expect: exit 0, 0 fallidas
npx vitest run tests/afinidad.test.ts     # expect: exit 0
npm run check    # expect: exit 0
```

## Trampas

- **Redondear de más** — solo `afinidad` se redondea; `cobertura` y `jaccard` se devuelven completas (los porcentajes de la interfaz se redondean al mostrarlos).
- **Ordenar con `localeCompare` sin idioma** — usa `"es"`; sin él, `Á` y `É` quedan al final.
- **Importar `afinidad.ts` en la isla** — arrastra todos los JSON al navegador. La isla usa `pesos.ts` y `sugerencias.ts`.

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
