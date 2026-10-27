# Épica 05: Entrevista simulada

> Una persona puede contar su experiencia y ver qué competencias se reconocen y qué ocupaciones se parecen, sin que nada se guarde ni se envíe.

| | |
|---|---|
| **Id de épica** | `05-entrevista` |
| **Tareas** | `E5-T1` (paso 12) · `E5-T2` (paso 13) |
| **Depende de** | `03-motor` (`pesos.ts`, `datos.ts`, `tests/fixtures/datos-minimos.ts`); `E5-T2` además espera `E4-T1` (portada y `src/lib/formato.ts`) |
| **Desbloquea** | `06-calidad-publicacion` |
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
src/
  lib/traductor/tipos.ts           # NUEVO (E5-T1) — contrato TraductorCompetencias
  lib/traductor/palabras-clave.ts  # NUEVO (E5-T1) — implementación simulada
  lib/sugerencias.ts               # NUEVO (E5-T1) — sugerirOcupaciones()
  components/islas/Entrevista.tsx  # NUEVO (E5-T2) — única isla React
  pages/entrevista.astro           # NUEVO (E5-T2)
  lib/pesos.ts, lib/datos.ts       # existen (03), solo lectura
  lib/formato.ts                   # existe (04, E4-T1), solo lectura
tests/
  traductor.test.ts                # NUEVO (E5-T1)
  fixtures/datos-minimos.ts        # existe (03), solo lectura
e2e/
  entrevista.spec.ts               # NUEVO (E5-T2)
```

## Datos que toca

Lee `competencias` (con `palabrasClave`), `mapeo` y `{ id, nombreCorto }` de las ocupaciones, que la página pasa a la isla como props. **No guarda nada**: lo que la persona escribe vive solo en el estado de React.

## Contratos

**Consumidos:**

| De | Interfaz | Garantía |
|---|---|---|
| `03-motor` | `peso(tipo)`, `OcupacionMotor` en `src/lib/pesos.ts` | sin dependencias de datos |
| `03-motor` | `datosMinimos` en `tests/fixtures/datos-minimos.ts` | ocupaciones `a`–`d`, competencias `C01`, `C02`, `C03`, `C26` |
| `04-paginas` | `formatearPorcentaje(valor, decimales)` en `src/lib/formato.ts` | `formatearPorcentaje(40, 0)` → `"40 %"` |

**Producidos:**

| Exporta | Firma | Usado por |
|---|---|---|
| `src/lib/traductor/tipos.ts` | `type TraductorCompetencias = (relatos: string[]) => Promise<CompetenciaDetectada[]>` | adaptador QVAC futuro (§5 de `blueprint.md`) |
| `src/lib/traductor/palabras-clave.ts` | `crearTraductorPalabrasClave(competencias): TraductorCompetencias`; `normalizar(texto): string` | `Entrevista.tsx` |
| `src/lib/sugerencias.ts` | `sugerirOcupaciones(detectadas: string[], datos: DatosSugerencia, maximo = 3): Sugerencia[]` | `Entrevista.tsx` |

## Convenciones que muerden aquí

- La isla nunca importa `datos.ts`, `afinidad.ts` ni los JSON: todo llega por props.
- Sin `fetch`, sin `localStorage`, sin `sessionStorage`; la prueba E2E lo verifica.
- Cada `<textarea>` con su `<label htmlFor>`; el error en `role="alert"`; los resultados en `aria-live="polite"`; el botón con `type="submit"`.
- El texto de la interfaz dice que la traducción es simulada y que la versión final usará la IA local QVAC de Tether. Nunca dice que evalúa o certifica.

Reglas completas: `CLAUDE.md`. Reglas de área: `.claude/rules/ui.md`.

---

## Tareas

En el mismo orden que `tasks.json`. Ese orden es el orden de construcción: trabaja de arriba hacia abajo y no reordenes por prioridad ni por lo que parezca rápido.

### `E5-T1` — Traductor por palabras clave y sugerencias

**Depende de:** `E3-T2` · **Prioridad:** p1 — metadato para recortes de alcance, no un orden de ejecución · **Paso de `blueprint.md`:** 12

Antes de empezar: `git tag -f inicio-paso-12` (punto de retorno de esta tarea).

Crear la costura del traductor (relato → competencias) con una implementación simulada por palabras clave, y el cálculo de ocupaciones sugeridas. Todo es puro y recibe sus datos por parámetro, para que la isla del paso 13 no cargue los JSON completos y para que mañana un adaptador de QVAC pueda reemplazar la implementación sin tocar la interfaz (contrato en §5).

`src/lib/traductor/tipos.ts` — contenido literal:

```ts
import type { Competencia } from "../esquemas.ts";

export type CompetenciaDetectada = {
  id: string;
  nombre: string;
  tipo: Competencia["tipo"];
  palabrasEncontradas: string[];
};

/** Contrato estable: hoy lo implementa palabras-clave.ts; en la versión final, un adaptador de QVAC. */
export type TraductorCompetencias = (relatos: string[]) => Promise<CompetenciaDetectada[]>;
```

`src/lib/traductor/palabras-clave.ts` — contenido literal. Normaliza (minúsculas + NFD + quitar diacríticos) y busca cada palabra clave como palabra o frase completa con límites `\b`; una competencia se detecta con al menos una coincidencia:

```ts
import type { Competencia } from "../esquemas.ts";
import type { CompetenciaDetectada, TraductorCompetencias } from "./tipos.ts";

export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function expresionPara(palabraClave: string): RegExp {
  const escapada = palabraClave.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s+");
  return new RegExp(`\\b${escapada}\\b`);
}

export function crearTraductorPalabrasClave(
  competencias: Pick<Competencia, "id" | "nombre" | "tipo" | "palabrasClave">[],
): TraductorCompetencias {
  const reglas = competencias.map((competencia) => ({
    competencia,
    expresiones: competencia.palabrasClave.map((palabra) => ({
      palabra,
      expresion: expresionPara(palabra),
    })),
  }));

  return async (relatos) => {
    const texto = normalizar(relatos.join("\n"));
    if (texto.trim().length === 0) {
      return [];
    }
    const detectadas: CompetenciaDetectada[] = [];
    for (const { competencia, expresiones } of reglas) {
      const palabrasEncontradas = expresiones
        .filter(({ expresion }) => expresion.test(texto))
        .map(({ palabra }) => palabra);
      if (palabrasEncontradas.length > 0) {
        detectadas.push({
          id: competencia.id,
          nombre: competencia.nombre,
          tipo: competencia.tipo,
          palabrasEncontradas,
        });
      }
    }
    return detectadas.sort((x, y) => x.id.localeCompare(y.id));
  };
}
```

`src/lib/sugerencias.ts` — contenido literal. Puntaje de cada ocupación = Σpeso(competencias de la ocupación que fueron detectadas) / Σpeso(competencias de la ocupación); devuelve las de puntaje mayor que 0, de mayor a menor, empate por `nombreCorto`:

```ts
import type { Competencia, Mapeo } from "./esquemas.ts";
import { type OcupacionMotor, peso } from "./pesos.ts";

export type DatosSugerencia = {
  ocupaciones: OcupacionMotor[];
  competencias: Pick<Competencia, "id" | "tipo">[];
  mapeo: Mapeo;
};

export type Sugerencia = { ocupacion: OcupacionMotor; cobertura: number };

export function sugerirOcupaciones(
  detectadas: string[],
  datos: DatosSugerencia,
  maximo = 3,
): Sugerencia[] {
  const tipoPorId = new Map(
    datos.competencias.map((competencia) => [competencia.id, competencia.tipo]),
  );
  const pesoDe = (id: string): number => {
    const tipo = tipoPorId.get(id);
    return tipo === undefined ? 0 : peso(tipo);
  };
  const conjuntoDetectado = new Set(detectadas);
  return datos.ocupaciones
    .map((ocupacion) => {
      const ids = Object.keys(datos.mapeo[ocupacion.id] ?? {});
      const total = ids.reduce((suma, id) => suma + pesoDe(id), 0);
      const cubierto = ids
        .filter((id) => conjuntoDetectado.has(id))
        .reduce((suma, id) => suma + pesoDe(id), 0);
      return { ocupacion, cobertura: total === 0 ? 0 : cubierto / total };
    })
    .filter((sugerencia) => sugerencia.cobertura > 0)
    .sort(
      (x, y) =>
        y.cobertura - x.cobertura ||
        x.ocupacion.nombreCorto.localeCompare(y.ocupacion.nombreCorto, "es"),
    )
    .slice(0, maximo);
}
```

`tests/traductor.test.ts` — crea el traductor con las competencias reales de `src/data/competencias.json` y comprueba:

1. `["cobro con yape y cuadro la caja al cierre"]` → los ids detectados incluyen `C03` (con `palabrasEncontradas` que contiene `yape`) y `C04` (con `cuadro`).
2. `["Uso lejía para desinfectar los baños"]` → incluye `C11` (con `lejia`).
3. `[""]` → `[]` y `["   "]` → `[]`.
4. `["posada"]` → no incluye `C03`.
5. `sugerirOcupaciones(["C01"], datosMinimos)` (de `tests/fixtures/datos-minimos.ts`) devuelve ids `["d", "c", "a"]` con coberturas `1`, `1` y `0.4` (`toBeCloseTo(…, 6)`); con datos reales (`ocupaciones`, `competencias`, `mapeo` importados de los JSON) y los ids detectados en el punto 1, devuelve como máximo 3 sugerencias, todas con cobertura mayor que 0 y en orden no creciente.

Al final: `npm run format`.

**Archivos**

- `src/lib/traductor/tipos.ts` — nuevo
- `src/lib/traductor/palabras-clave.ts` — nuevo
- `src/lib/sugerencias.ts` — nuevo
- `tests/traductor.test.ts` — nuevo

**Aceptación**

Copiada del arreglo `acceptance` de esta tarea en `tasks.json` — idéntica tras quitar el énfasis markdown. Cada criterio se decide con un comando de abajo, en esta máquina, durante la construcción.

1. **WHEN** el traductor de palabras clave recibe `cobro con yape y cuadro la caja al cierre` **THE SYSTEM SHALL** detectar `C03` por `yape` y `C04` por `cuadro`.
2. **WHEN** el traductor recibe `Uso lejía para desinfectar los baños` **THE SYSTEM SHALL** detectar `C11` por `lejia`, ignorando tildes y mayúsculas.
3. **WHEN** el traductor recibe un relato vacío o solo con espacios **THE SYSTEM SHALL** devolver una lista vacía.
4. **WHEN** el traductor recibe `posada` **THE SYSTEM SHALL** no detectar `C03`, porque la palabra clave `pos` solo coincide como palabra completa.
5. **WHEN** `sugerirOcupaciones` recibe `["C01"]` con el conjunto mínimo de prueba **THE SYSTEM SHALL** devolver `d`, `c` y `a` en ese orden con coberturas 1, 1 y 0.4, y con datos reales SHALL devolver como máximo 3 ocupaciones, todas con cobertura mayor que 0 y en orden no creciente.
6. **WHEN** `npm run check` y `npm test` se ejecutan **THE SYSTEM SHALL** terminar ambos con código 0.

**Verify** — cada comando, en orden, desde la raíz del proyecto. Cada uno termina con 0 cuando la tarea está bien; la tarea está hecha cuando el último termina con 0.

```bash
npx vitest run tests/traductor.test.ts   # expect: exit 0, 0 fallidas, 0 omitidas
npm test   # expect: exit 0 — ninguna prueba anterior se rompió
npm run check   # expect: exit 0 — astro check sin errores y biome check sin diagnósticos de error
```

Estas líneas son el arreglo `verify` de esta tarea en `tasks.json`, una por línea, con el envoltorio de código de salida intacto (`status=0; cmd || status=$?; test "$status" -eq N`). No las "limpies".

**Checkpoint**

```bash
git add -A && git commit -m "paso 12: Traductor por palabras clave y sugerencias (E5-T1)" && git tag paso-12
```

Ejecútala después de que el último comando de **Verify** termine con 0 y antes de empezar la siguiente tarea. `paso-12` es el valor `checkpoint` de esta tarea en `tasks.json` y la marca que cuenta §20.1. Si esta tarea sale mal antes de completarse, vuelve con `git reset --hard inicio-paso-12` y reintenta, en lugar de depurar hacia adelante; nunca uses `git reset --hard paso-NN`, que borraría los commits `codex: correcciones etapa …`. Nunca inventes el tag.

### `E5-T2` — Isla de entrevista sin guardar datos

**Depende de:** `E4-T1`, `E5-T1` · **Prioridad:** p1 — metadato para recortes de alcance, no un orden de ejecución · **Paso de `blueprint.md`:** 13

Antes de empezar: `git tag -f inicio-paso-13` (punto de retorno de esta tarea).

Crear la entrevista: la única isla interactiva del sitio. La persona cuenta su experiencia con sus palabras y ve qué competencias se reconocen y qué ocupaciones se parecen. Nada se guarda ni se envía.

`src/pages/entrevista.astro` — `Base` con `titulo="Cuéntanos tu experiencia"` y `descripcion="Cuenta con tus palabras qué haces en tu trabajo y descubre qué competencias tienes."`. Importa `ocupaciones`, `competencias` y `mapeo` de `../lib/datos.ts` y pasa a la isla **solo** lo mínimo: `ocupaciones.map(({ id, nombreCorto }) => ({ id, nombreCorto }))`, `competencias` y `mapeo`. Contiene `<h1>Cuéntanos tu experiencia</h1>`, el párrafo `Responde con tus palabras, como se lo contarías a un amigo. No necesitas responder todo.` y `<Entrevista client:load ocupaciones={…} competencias={…} mapeo={…} />`.

`src/components/islas/Entrevista.tsx` — componente React (función, sin dependencias nuevas). Crea el traductor una sola vez con `crearTraductorPalabrasClave(competencias)` (de `../../lib/traductor/palabras-clave.ts`) y usa `sugerirOcupaciones` (de `../../lib/sugerencias.ts`) y `formatearPorcentaje` (de `../../lib/formato.ts`). Nunca importa `datos.ts` ni los JSON. Comportamiento y textos literales:

- Un `<form>` con 3 `<textarea rows={4}>`, cada uno con `<label htmlFor>`:
  1. `Cuéntanos un día normal en tu trabajo: ¿qué haces desde que llegas?`
  2. `Recuerda una vez que resolviste un problema en el trabajo. ¿Qué pasó y qué hiciste?`
  3. `¿Qué es lo que mejor sabes hacer y por qué te lo reconocen?`
- Un `<button type="submit">` con el texto `Ver mis competencias` (clases de botón principal: `min-h-12 w-full sm:w-auto rounded-base bg-primario px-6 font-semibold text-fondo`).
- Debajo, siempre visible, en `text-base text-texto-suave`: `Traducción simulada por palabras clave. En la versión final la realizará la IA local QVAC de Tether.` y `No guardamos ni enviamos lo que escribes: todo ocurre en tu navegador.`
- Al enviar (`event.preventDefault()`): si ninguna respuesta tiene al menos 15 caracteres tras `trim()`, muestra en un `<p role="alert">` el texto `Escribe al menos 15 caracteres en alguna de las respuestas.`, limpia resultados anteriores y no procesa nada.
- Si pasa la validación, `await traductor(respuestas)`. Los resultados van en una sección `aria-live="polite"`:
  - Con 1 o más detectadas: `<h2>Competencias que reconocimos</h2>` y una lista de chips (`rounded-base bg-ya-tienes-fondo px-2 py-1 text-ya-tienes-texto`) con el `nombre` de cada competencia; luego `<h2>Ocupaciones parecidas a tu experiencia</h2>` y una lista con `sugerirOcupaciones(ids, { ocupaciones, competencias, mapeo })`: por cada una, un enlace a `/ocupaciones/<id>/` con texto `nombreCorto` y el texto `Coincide con el {formatearPorcentaje(cobertura * 100, 0)} de sus competencias`.
  - Con 0 detectadas: `No encontramos competencias en lo que escribiste. Cuéntanos con más detalle qué haces en tu trabajo.`
- Sin `fetch`, sin `localStorage`, sin `sessionStorage`, sin cookies, sin `console.log` de lo escrito.

`e2e/entrevista.spec.ts` — comprueba:
1. `h1` = `Cuéntanos tu experiencia`; existen los 3 campos por su etiqueta (`getByLabel` con cada pregunta) y el texto `Traducción simulada por palabras clave. En la versión final la realizará la IA local QVAC de Tether.`
2. Escribir `cobro con yape y cuadro la caja al cierre` en la primera pregunta y pulsar `Ver mis competencias` → aparece `Cobro con medios de pago electrónicos`; la cantidad de enlaces de `main` con `href` que empieza con `/ocupaciones/` está entre 1 y 3.
3. Escribir `hola` en las tres preguntas y pulsar el botón → `getByRole("alert")` muestra `Escribe al menos 15 caracteres en alguna de las respuestas.` y no aparece `Competencias que reconocimos`.
4. Escribir `me gusta mucho el futbol los domingos` y pulsar → aparece `No encontramos competencias en lo que escribiste. Cuéntanos con más detalle qué haces en tu trabajo.`
5. Registrando `page.on("request")` justo antes del clic del punto 2, la cantidad de peticiones después del clic es 0; al terminar, `localStorage.length` y `sessionStorage.length` valen 0.

Al final: `npm run format`.

**Archivos**

- `src/components/islas/Entrevista.tsx` — nuevo
- `src/pages/entrevista.astro` — nuevo
- `e2e/entrevista.spec.ts` — nuevo

**Aceptación**

Copiada del arreglo `acceptance` de esta tarea en `tasks.json` — idéntica tras quitar el énfasis markdown. Cada criterio se decide con un comando de abajo, en esta máquina, durante la construcción.

1. **WHEN** `/entrevista/` se carga **THE SYSTEM SHALL** mostrar el `h1` `Cuéntanos tu experiencia`, las 3 preguntas como etiquetas de 3 campos de texto y el aviso `Traducción simulada por palabras clave. En la versión final la realizará la IA local QVAC de Tether.`
2. **WHEN** se escribe `cobro con yape y cuadro la caja al cierre` en la primera pregunta y se pulsa `Ver mis competencias` **THE SYSTEM SHALL** mostrar la competencia `Cobro con medios de pago electrónicos` y entre 1 y 3 enlaces a `/ocupaciones/<id>/`.
3. **WHEN** se pulsa `Ver mis competencias` con todas las respuestas de menos de 15 caracteres **THE SYSTEM SHALL** mostrar en un elemento `role="alert"` el texto `Escribe al menos 15 caracteres en alguna de las respuestas.` y no mostrar resultados.
4. **WHEN** la respuesta `me gusta mucho el futbol los domingos` se envía **THE SYSTEM SHALL** mostrar `No encontramos competencias en lo que escribiste. Cuéntanos con más detalle qué haces en tu trabajo.`
5. **WHEN** se completa el flujo de la entrevista **THE SYSTEM SHALL** no hacer ninguna petición de red después del clic y dejar `localStorage.length` y `sessionStorage.length` en 0.
6. **WHEN** `npx playwright test e2e/entrevista.spec.ts` y `npm run check` se ejecutan **THE SYSTEM SHALL** terminar ambos con código 0.

**Verify** — cada comando, en orden, desde la raíz del proyecto. Cada uno termina con 0 cuando la tarea está bien; la tarea está hecha cuando el último termina con 0.

```bash
npm run check   # expect: exit 0 — astro check sin errores y biome check sin diagnósticos de error
npx playwright test e2e/entrevista.spec.ts   # expect: exit 0, 0 fallidas
```

Estas líneas son el arreglo `verify` de esta tarea en `tasks.json`, una por línea, con el envoltorio de código de salida intacto (`status=0; cmd || status=$?; test "$status" -eq N`). No las "limpies".

**Checkpoint**

```bash
git add -A && git commit -m "paso 13: Isla de entrevista sin guardar datos (E5-T2)" && git tag paso-13
```

Ejecútala después de que el último comando de **Verify** termine con 0 y antes de empezar la siguiente tarea. `paso-13` es el valor `checkpoint` de esta tarea en `tasks.json` y la marca que cuenta §20.1. Si esta tarea sale mal antes de completarse, vuelve con `git reset --hard inicio-paso-13` y reintenta, en lugar de depurar hacia adelante; nunca uses `git reset --hard paso-NN`, que borraría los commits `codex: correcciones etapa …`. Nunca inventes el tag.

---

## Aceptación de la épica

La épica está hecha cuando todas sus tareas están `done` **y**:

1. **WHEN** una persona escribe un relato con palabras clave y pulsa `Ver mis competencias` **THE SYSTEM SHALL** mostrar las competencias reconocidas y hasta 3 ocupaciones parecidas sin hacer peticiones de red.
2. **WHEN** el relato es demasiado corto o no contiene palabras clave **THE SYSTEM SHALL** mostrar el mensaje correspondiente y ningún resultado.

```bash
npm test                                     # expect: exit 0, 0 fallidas
npx playwright test e2e/entrevista.spec.ts   # expect: exit 0, 0 fallidas
```

## Trampas

- **`formato.ts` viene de `E4-T1`** — por eso `E5-T2` depende de `E4-T1` y `E5-T1` en `tasks.json`. No dupliques `formatearPorcentaje` dentro de la isla: impórtalo.
- **Palabra clave dentro de otra palabra** — `pos` no debe coincidir en `posada`; por eso la expresión usa `\b` a ambos lados.
- **Hidratación** — `client:load` es obligatorio; sin directiva, la isla se renderiza como HTML sin interacción y la prueba E2E falla.

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
