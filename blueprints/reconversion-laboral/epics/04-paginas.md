# Épica 04: Páginas estáticas

> La portada, el directorio de ocupaciones, las 9 páginas de ranking y las 72 páginas de transición existen como HTML estático, accesible y móvil primero.

| | |
|---|---|
| **Id de épica** | `04-paginas` |
| **Tareas** | `E4-T1` (paso 8) · `E4-T2` (paso 9) · `E4-T3` (paso 10) · `E4-T4` (paso 11) |
| **Depende de** | `01-base` (layout y tokens) y `03-motor` (datos y motor) |
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
  pages/
    index.astro                        # existe (01), se reemplaza en E4-T1 — portada real
    ocupaciones/index.astro            # NUEVO (E4-T2) — directorio de 9 ocupaciones
    ocupaciones/[id].astro             # NUEVO (E4-T3) — 9 páginas de ranking
    transicion/[origen]/[destino].astro  # NUEVO (E4-T4) — 72 páginas de transición
  components/
    BotonEnlace.astro                  # NUEVO (E4-T1)
    DatoInformalidad.astro             # NUEVO (E4-T1)
    TarjetaOcupacion.astro             # NUEVO (E4-T2)
    FilaDestino.astro                  # NUEVO (E4-T3)
    InsigniaDemanda.astro              # NUEVO (E4-T3)
    ChipCompetencia.astro              # NUEVO (E4-T4)
    ItemPorFortalecer.astro            # NUEVO (E4-T4)
  lib/formato.ts                       # NUEVO (E4-T1) — formatearPorcentaje()
  lib/datos.ts, lib/afinidad.ts        # existen (03), solo lectura
  layouts/Base.astro                   # existe (01), solo lectura
e2e/
  portada.spec.ts                      # NUEVO (E4-T1)
  ocupaciones.spec.ts                  # NUEVO (E4-T2)
  ocupacion.spec.ts                    # NUEVO (E4-T3)
  transicion.spec.ts                   # NUEVO (E4-T4)
```

## Datos que toca

Lee (no escribe) `ocupaciones`, `contexto`, `ranking()` y `calcularTransicion()` de `03-motor`. Ninguna página guarda nada.

## Contratos

**Consumidos:**

| De | Interfaz | Garantía |
|---|---|---|
| `01-base` | `Base.astro` props `{ titulo, descripcion }` | título `"<titulo> \| Reconversión Laboral"`, aviso y pie incluidos |
| `03-motor` | `ranking(origen): Transicion[]` | 8 destinos, ya ordenados; nunca reordenar en la página |
| `03-motor` | `calcularTransicion(origen, destino): Transicion` | lanza `Error` si son iguales o desconocidos |
| `03-motor` | `contexto` | `informalidadNacional: 69.8`, `fuente` con el texto IEES |

**Producidos:**

| Exporta | Firma | Usado por |
|---|---|---|
| `src/lib/formato.ts` | `formatearPorcentaje(valor: number, decimales = 1): string` → `"69,8 %"` | `05-entrevista` |
| Rutas `/ocupaciones/<id>/` y `/transicion/<origen>/<destino>/` | HTML estático | enlaces de `05-entrevista`, pruebas de `06` |

## Convenciones que muerden aquí

- Ninguna página de esta épica lleva `<script>` ni isla: todo se calcula al construir.
- `N = Math.round(cobertura * 100)` es el único porcentaje que se muestra al usuario; el orden es por afinidad.
- Cada chip lleva su texto (`Ya lo tienes` / `Por fortalecer`) y cada insignia dice `Demanda referencial: …`.
- Ids de elemento largos con `break-words`: sin eso, 360 px produce scroll horizontal.
- Enlaces repetidos con nombre accesible único (`aria-label` con el nombre del destino).

Reglas completas: `CLAUDE.md`. Reglas de área: `.claude/rules/ui.md`.

---

## Tareas

En el mismo orden que `tasks.json`. Ese orden es el orden de construcción: trabaja de arriba hacia abajo y no reordenes por prioridad ni por lo que parezca rápido.

### `E4-T1` — Portada con dato de informalidad y llamados

**Depende de:** `E1-T2`, `E3-T2` · **Prioridad:** p0 — metadato para recortes de alcance, no un orden de ejecución · **Paso de `blueprint.md`:** 8

Antes de empezar: `git tag -f inicio-paso-08` (punto de retorno de esta tarea).

Reemplazar la portada provisional por la portada real: titular, dato de informalidad con su fuente, dos llamados a la acción y la explicación en 3 pasos. Sin JavaScript de cliente.

`src/lib/formato.ts` — contenido literal (no se usa `toLocaleString`: la configuración regional `es-PE` usa punto decimal, y el diseño pide coma):

```ts
export function formatearPorcentaje(valor: number, decimales = 1): string {
  return `${valor.toFixed(decimales).replace(".", ",")} %`;
}
```

`src/components/BotonEnlace.astro` — enlace con aspecto de botón. Props `href: string` y `variante: "principal" | "secundario"`. Clases comunes `inline-flex min-h-12 w-full items-center justify-center rounded-base px-6 font-semibold no-underline sm:w-auto`; `principal` agrega `bg-primario text-fondo hover:bg-primario-oscuro`; `secundario` agrega `border border-primario bg-fondo text-primario`. El texto llega por `<slot />`.

`src/components/DatoInformalidad.astro` — recibe `contexto` (tipo `Contexto` de `src/lib/esquemas.ts`) y muestra, dentro de una tarjeta `rounded-base border border-borde bg-superficie p-4`:
- el número `formatearPorcentaje(contexto.informalidadNacional)` → `69,8 %` en `text-4xl font-bold text-primario`;
- el texto `de las personas que trabajan en el Perú tiene un empleo informal (` + `contexto.periodo` + `).`;
- `Fuente: ` + `contexto.fuente`, en `text-base text-texto-suave`.

`src/pages/index.astro` — usa `Base` con `titulo="Inicio"` y la misma `descripcion` del paso 2, importa `contexto` de `../lib/datos.ts`, y contiene en este orden:
1. `<h1>Lo que ya sabes hacer vale en otros trabajos</h1>`.
2. Un párrafo: `Elige tu ocupación y descubre a qué trabajos afines puedes pasar, qué competencias ya tienes y cuáles te conviene fortalecer, según el Catálogo Nacional de Perfiles Ocupacionales del MTPE.`
3. Los dos botones en un contenedor `flex flex-col gap-3 sm:flex-row`: `<BotonEnlace href="/ocupaciones/" variante="principal">Elige tu ocupación</BotonEnlace>` y `<BotonEnlace href="/entrevista/" variante="secundario">Cuéntanos tu experiencia</BotonEnlace>`.
4. `<DatoInformalidad contexto={contexto} />`.
5. `<h2>Cómo funciona</h2>` y una `<ol>` con exactamente 3 `<li>`: `Elige la ocupación en la que trabajas o cuéntanos tu experiencia.` · `Mira a qué trabajos afines puedes pasar y cuánto de lo que piden ya sabes hacer.` · `Revisa qué te falta fortalecer y dónde capacitarte gratis.`
6. Un párrafo en `text-texto-suave`: `Es una orientación preliminar: no evalúa ni certifica tus competencias.`

`e2e/portada.spec.ts` — comprueba: el `h1` tiene exactamente el texto `Lo que ya sabes hacer vale en otros trabajos`; la página contiene `69,8 %` y `Fuente: IEES (Sociedad Nacional de Industrias) con datos INEI-EPEN, Reporte Estadístico Laboral N° 02-2026`; `getByRole("link", { name: "Elige tu ocupación" })` tiene `href` `/ocupaciones/` y `getByRole("link", { name: "Cuéntanos tu experiencia" })` tiene `href` `/entrevista/`, y el `boundingBox().height` de cada uno es al menos 48; `main ol > li` tiene 3 elementos; con `page.setViewportSize({ width: 360, height: 740 })`, `document.documentElement.scrollWidth` es menor o igual a 360.

`e2e/esqueleto.spec.ts` y `e2e/layout.spec.ts` no se tocan y deben seguir pasando: la portada mantiene un solo `h1`, el título `Inicio | Reconversión Laboral` y cero `img`. Al final: `npm run format`.

**Archivos**

- `src/pages/index.astro` — edición
- `src/components/DatoInformalidad.astro` — nuevo
- `src/components/BotonEnlace.astro` — nuevo
- `src/lib/formato.ts` — nuevo
- `e2e/portada.spec.ts` — nuevo

**Aceptación**

Copiada del arreglo `acceptance` de esta tarea en `tasks.json` — idéntica tras quitar el énfasis markdown. Cada criterio se decide con un comando de abajo, en esta máquina, durante la construcción.

1. **WHEN** `/` se carga **THE SYSTEM SHALL** mostrar el `h1` `Lo que ya sabes hacer vale en otros trabajos`.
2. **WHEN** `/` se carga **THE SYSTEM SHALL** mostrar el dato `69,8 %` y el texto `Fuente: IEES (Sociedad Nacional de Industrias) con datos INEI-EPEN, Reporte Estadístico Laboral N° 02-2026`.
3. **WHEN** `/` se carga **THE SYSTEM SHALL** mostrar el enlace `Elige tu ocupación` con `href="/ocupaciones/"` y el enlace `Cuéntanos tu experiencia` con `href="/entrevista/"`, cada uno de al menos 48 px de alto.
4. **WHEN** `/` se carga **THE SYSTEM SHALL** mostrar dentro de `main` una lista ordenada con exactamente 3 pasos.
5. **WHEN** `/` se abre con 360 px de ancho **THE SYSTEM SHALL** tener `document.documentElement.scrollWidth` menor o igual a 360.
6. **WHEN** `npx playwright test e2e/esqueleto.spec.ts e2e/layout.spec.ts e2e/portada.spec.ts` y `npm run check` se ejecutan **THE SYSTEM SHALL** terminar ambos con código 0.

**Verify** — cada comando, en orden, desde la raíz del proyecto. Cada uno termina con 0 cuando la tarea está bien; la tarea está hecha cuando el último termina con 0.

```bash
npm run check   # expect: exit 0 — astro check sin errores y biome check sin diagnósticos de error
npx playwright test e2e/esqueleto.spec.ts e2e/layout.spec.ts e2e/portada.spec.ts   # expect: exit 0, 0 fallidas — las puertas de los pasos 1 y 2 siguen en verde
```

Estas líneas son el arreglo `verify` de esta tarea en `tasks.json`, una por línea, con el envoltorio de código de salida intacto (`status=0; cmd || status=$?; test "$status" -eq N`). No las "limpies".

**Checkpoint**

```bash
git add -A && git commit -m "paso 08: Portada con dato de informalidad y llamados (E4-T1)" && git tag paso-08
```

Ejecútala después de que el último comando de **Verify** termine con 0 y antes de empezar la siguiente tarea. `paso-08` es el valor `checkpoint` de esta tarea en `tasks.json` y la marca que cuenta §20.1. Si esta tarea sale mal antes de completarse, vuelve con `git reset --hard inicio-paso-08` y reintenta, en lugar de depurar hacia adelante; nunca uses `git reset --hard paso-NN`, que borraría los commits `codex: correcciones etapa …`. Nunca inventes el tag.

### `E4-T2` — Directorio de ocupaciones

**Depende de:** `E1-T2`, `E3-T2` · **Prioridad:** p0 — metadato para recortes de alcance, no un orden de ejecución · **Paso de `blueprint.md`:** 9

Antes de empezar: `git tag -f inicio-paso-09` (punto de retorno de esta tarea).

Crear el directorio de las 9 ocupaciones, la puerta de entrada al recorrido. Página estática sin `<script>`.

`src/components/TarjetaOcupacion.astro` — recibe `ocupacion` (tipo `Ocupacion`). Es un `<li>` con una tarjeta `rounded-base border border-borde bg-fondo p-4` que contiene:
- `<h2 class="text-xl">` con un enlace a `/ocupaciones/<id>/` cuyo texto es `nombreCorto` (todo el enlace es el nombre: así el nombre accesible es único);
- un párrafo `text-base text-texto-suave` con `También: ` + los `puestos` unidos con `, `;
- el código del perfil `CNPO <codigo>` en `text-sm text-texto-suave`.

`src/pages/ocupaciones/index.astro` — `Base` con `titulo="Elige tu ocupación"` y `descripcion="Elige la ocupación en la que trabajas para ver a qué trabajos afines puedes pasar."`; importa `ocupaciones` de `../../lib/datos.ts`; contiene `<h1>Elige tu ocupación</h1>`, el párrafo `Toca la ocupación en la que trabajas o trabajaste. Te mostraremos los trabajos afines según el CNPO.` y una `<ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">` con una `TarjetaOcupacion` por ocupación, en el orden de `ocupaciones.json`.

`e2e/ocupaciones.spec.ts` — comprueba: `/ocupaciones/` responde 200; el `h1` es `Elige tu ocupación` y el título `Elige tu ocupación | Reconversión Laboral`; para cada uno de los 9 ids (`almacen`, `atencion_telefonica`, `caja_comercial`, `caja_financiera`, `housekeeping`, `lavanderia`, `limpieza`, `salon_comidas`, `trabajador_hogar`) existe exactamente un enlace con `href` `/ocupaciones/<id>/` dentro de `main`; el enlace de `caja_comercial` tiene el texto `Cajero(a) de tienda`; con 360 px de ancho, `document.documentElement.scrollWidth` es menor o igual a 360.

Al final: `npm run format`.

**Archivos**

- `src/pages/ocupaciones/index.astro` — nuevo
- `src/components/TarjetaOcupacion.astro` — nuevo
- `e2e/ocupaciones.spec.ts` — nuevo

**Aceptación**

Copiada del arreglo `acceptance` de esta tarea en `tasks.json` — idéntica tras quitar el énfasis markdown. Cada criterio se decide con un comando de abajo, en esta máquina, durante la construcción.

1. **WHEN** `/ocupaciones/` se carga **THE SYSTEM SHALL** responder 200, mostrar el `h1` `Elige tu ocupación` y tener el título `Elige tu ocupación | Reconversión Laboral`.
2. **WHEN** `/ocupaciones/` se carga **THE SYSTEM SHALL** mostrar dentro de `main` exactamente un enlace a `/ocupaciones/<id>/` por cada uno de los 9 ids de `ocupaciones.json`, y el de `caja_comercial` SHALL tener el texto `Cajero(a) de tienda`.
3. **WHEN** `/ocupaciones/` se abre con 360 px de ancho **THE SYSTEM SHALL** tener `document.documentElement.scrollWidth` menor o igual a 360.
4. **WHEN** se inspecciona `dist/ocupaciones/index.html` después de `npm run build` **THE SYSTEM SHALL** no contener ninguna etiqueta `<script`.
5. **WHEN** `npx playwright test e2e/ocupaciones.spec.ts` y `npm run check` se ejecutan **THE SYSTEM SHALL** terminar ambos con código 0.

**Verify** — cada comando, en orden, desde la raíz del proyecto. Cada uno termina con 0 cuando la tarea está bien; la tarea está hecha cuando el último termina con 0.

```bash
npm run build   # expect: exit 0
status=0; grep -q '<script' dist/ocupaciones/index.html || status=$?; test "$status" -eq 1   # expect: exit 0 — 1 = sin JavaScript de cliente · 2 = archivo inexistente, y eso ahora falla
npm run check   # expect: exit 0 — astro check sin errores y biome check sin diagnósticos de error
npx playwright test e2e/ocupaciones.spec.ts   # expect: exit 0, 0 fallidas
```

Estas líneas son el arreglo `verify` de esta tarea en `tasks.json`, una por línea, con el envoltorio de código de salida intacto (`status=0; cmd || status=$?; test "$status" -eq N`). No las "limpies".

**Checkpoint**

```bash
git add -A && git commit -m "paso 09: Directorio de ocupaciones (E4-T2)" && git tag paso-09
```

Ejecútala después de que el último comando de **Verify** termine con 0 y antes de empezar la siguiente tarea. `paso-09` es el valor `checkpoint` de esta tarea en `tasks.json` y la marca que cuenta §20.1. Si esta tarea sale mal antes de completarse, vuelve con `git reset --hard inicio-paso-09` y reintenta, en lugar de depurar hacia adelante; nunca uses `git reset --hard paso-NN`, que borraría los commits `codex: correcciones etapa …`. Nunca inventes el tag.

### `E4-T3` — Ranking de destinos por ocupación

**Depende de:** `E4-T2` · **Prioridad:** p0 — metadato para recortes de alcance, no un orden de ejecución · **Paso de `blueprint.md`:** 10

Antes de empezar: `git tag -f inicio-paso-10` (punto de retorno de esta tarea).

Generar una página por ocupación con su ranking de 8 destinos, ordenado por afinidad. Página estática sin `<script>`.

`src/components/InsigniaDemanda.astro` — recibe `nivel: "alta" | "media" | "baja"` y muestra `<span class="inline-block rounded-base bg-referencial-fondo px-2 py-1 text-sm font-semibold text-referencial-texto">Demanda referencial: Alta</span>` (`Alta`, `Media` o `Baja` con mayúscula inicial). No usa colores distintos por nivel: el texto es la señal.

`src/components/FilaDestino.astro` — recibe `transicion` (tipo `Transicion`), `destino` (tipo `Ocupacion`) y `origenId: string`. Es un `<li data-testid="destino" data-afinidad={transicion.afinidad}>` con tarjeta `rounded-base border border-borde p-4` que muestra:
- `<h3>` con `destino.nombreCorto`;
- `Ya tienes el {N} % de lo que pide este trabajo`, con `N = Math.round(transicion.cobertura * 100)`;
- una barra: contenedor `h-3 w-full rounded-base bg-superficie` con `aria-hidden="true"` y, dentro, un `div` `h-3 rounded-base bg-ya-tienes-texto` con `style={`width: ${N}%`}` (el porcentaje ya está en texto; la barra es decorativa);
- `<InsigniaDemanda nivel={destino.demanda.nivel} />`;
- `{compartidas.length} competencias que ya tienes · {porFortalecer.length} por fortalecer`;
- un enlace a `/transicion/{origenId}/{destino.id}/` con texto `Ver el detalle` y `aria-label` `Ver el detalle de la transición a {destino.nombreCorto}`.

`src/pages/ocupaciones/[id].astro` — `getStaticPaths()` devuelve un camino por cada ocupación de `datos.ts` (`params: { id }`). La página usa `Base` con `titulo` = `De {nombreCorto} a otros trabajos` y una `descripcion` que nombra la ocupación; contiene `<h1>De {nombreCorto} a otros trabajos</h1>`, el párrafo `Estos son los trabajos afines ordenados por afinidad: cuánto de lo que ya sabes hacer sirve en cada uno, según el CNPO.`, `<h2>Ocupaciones afines, de mayor a menor afinidad</h2>` (para que cada `<h3>` de `FilaDestino` quede bajo un `<h2>`: h1 → h2 → h3), una `<ol>` con una `FilaDestino` por cada elemento de `ranking(id)` **en ese orden**, y la nota `Demanda referencial: valor ilustrativo definido por el equipo. Se reemplazará con la Encuesta de Demanda Ocupacional 2026 del MTPE. No cambia el orden de la lista.` Si `ranking(id)` estuviera vacío (no puede ocurrir con 9 ocupaciones), mostraría `Aún no hay trabajos afines para esta ocupación.`

`e2e/ocupacion.spec.ts` — sobre `/ocupaciones/caja_comercial/` comprueba: el `h1` es `De Cajero(a) de tienda a otros trabajos`; hay exactamente 8 `[data-testid="destino"]`; ningún enlace apunta a `/transicion/caja_comercial/caja_comercial/`; los `data-afinidad` leídos en orden, convertidos con `Number`, forman una secuencia no creciente; cada fila contiene un texto que cumple `/Ya tienes el \d{1,3} % de lo que pide este trabajo/`, un texto que cumple `/Demanda referencial: (Alta|Media|Baja)/` y un enlace cuyo `href` empieza con `/transicion/caja_comercial/`; la página contiene `Se reemplazará con la Encuesta de Demanda Ocupacional 2026 del MTPE`; con 360 px de ancho, `scrollWidth` es menor o igual a 360. Además visita `/ocupaciones/limpieza/` y `/ocupaciones/salon_comidas/` y comprueba que cada una tiene 8 filas.

Al final: `npm run format`.

**Archivos**

- `src/pages/ocupaciones/[id].astro` — nuevo
- `src/components/FilaDestino.astro` — nuevo
- `src/components/InsigniaDemanda.astro` — nuevo
- `e2e/ocupacion.spec.ts` — nuevo

**Aceptación**

Copiada del arreglo `acceptance` de esta tarea en `tasks.json` — idéntica tras quitar el énfasis markdown. Cada criterio se decide con un comando de abajo, en esta máquina, durante la construcción.

1. **WHEN** `npm run build` se ejecuta **THE SYSTEM SHALL** generar `dist/ocupaciones/<id>/index.html` para cada uno de los 9 ids de `ocupaciones.json`.
2. **WHEN** `/ocupaciones/caja_comercial/` se carga **THE SYSTEM SHALL** mostrar el `h1` `De Cajero(a) de tienda a otros trabajos` y exactamente 8 elementos `[data-testid="destino"]`, sin ningún enlace a `/transicion/caja_comercial/caja_comercial/`.
3. **WHEN** se leen en orden los `data-afinidad` de esos 8 elementos **THE SYSTEM SHALL** encontrarlos en orden no creciente.
4. **WHEN** se lee cada fila de destino **THE SYSTEM SHALL** mostrar el texto `Ya tienes el <N> % de lo que pide este trabajo`, una insignia `Demanda referencial: Alta`, `Demanda referencial: Media` o `Demanda referencial: Baja`, y un enlace a `/transicion/caja_comercial/<destino>/`.
5. **WHEN** `/ocupaciones/caja_comercial/` se carga **THE SYSTEM SHALL** mostrar la nota `Se reemplazará con la Encuesta de Demanda Ocupacional 2026 del MTPE` y, con 360 px de ancho, `scrollWidth` menor o igual a 360.
6. **WHEN** `npx playwright test e2e/ocupacion.spec.ts` y `npm run check` se ejecutan **THE SYSTEM SHALL** terminar ambos con código 0.

**Verify** — cada comando, en orden, desde la raíz del proyecto. Cada uno termina con 0 cuando la tarea está bien; la tarea está hecha cuando el último termina con 0.

```bash
npm run build   # expect: exit 0
test "$(ls dist/ocupaciones/*/index.html | wc -l)" -eq 9   # expect: exit 0 — una página por ocupación de ocupaciones.json
npm run check   # expect: exit 0 — astro check sin errores y biome check sin diagnósticos de error
npx playwright test e2e/ocupacion.spec.ts   # expect: exit 0, 0 fallidas
```

Estas líneas son el arreglo `verify` de esta tarea en `tasks.json`, una por línea, con el envoltorio de código de salida intacto (`status=0; cmd || status=$?; test "$status" -eq N`). No las "limpies".

**Checkpoint**

```bash
git add -A && git commit -m "paso 10: Ranking de destinos por ocupación (E4-T3)" && git tag paso-10
```

Ejecútala después de que el último comando de **Verify** termine con 0 y antes de empezar la siguiente tarea. `paso-10` es el valor `checkpoint` de esta tarea en `tasks.json` y la marca que cuenta §20.1. Si esta tarea sale mal antes de completarse, vuelve con `git reset --hard inicio-paso-10` y reintenta, en lugar de depurar hacia adelante; nunca uses `git reset --hard paso-NN`, que borraría los commits `codex: correcciones etapa …`. Nunca inventes el tag.

### `E4-T4` — Páginas de transición con evidencia y cursos

**Depende de:** `E4-T3` · **Prioridad:** p0 — metadato para recortes de alcance, no un orden de ejecución · **Paso de `blueprint.md`:** 11

Antes de empezar: `git tag -f inicio-paso-11` (punto de retorno de esta tarea).

Generar las 72 páginas de transición (9 orígenes × 8 destinos): qué ya tienes, qué te falta y dónde capacitarte, con la evidencia del CNPO a la vista. Páginas estáticas sin `<script>`.

`src/components/ChipCompetencia.astro` — recibe `estado: "ya-tienes" | "por-fortalecer"`. Muestra un `<span>` con el texto `Ya lo tienes` (clases `bg-ya-tienes-fondo text-ya-tienes-texto`) o `Por fortalecer` (clases `bg-por-fortalecer-fondo text-por-fortalecer-texto`), más `inline-block rounded-base px-2 py-1 text-sm font-semibold`. El texto siempre está: el color nunca es la única señal.

`src/components/ItemPorFortalecer.astro` — recibe `item` (tipo `PorFortalecer` de `src/lib/afinidad.ts`). Es un `<li data-testid="por-fortalecer">` con: `<ChipCompetencia estado="por-fortalecer" />`, `<h3>` con `competencia.nombre`, `competencia.descripcionSencilla`, `Evidencia CNPO: ` + `evidenciaDestino` unidos con `, ` (en `break-words text-sm text-texto-suave`), un enlace a `item.curso.url` con texto `Busca el tema «{curso.tema}» en Capacíta-T (gratuito)` y el texto `Duración referencial: {curso.horasReferenciales} horas`.

`src/pages/transicion/[origen]/[destino].astro` — `getStaticPaths()` devuelve un camino por cada par ordenado de ocupaciones distintas (`params: { origen, destino }`). Con `t = calcularTransicion(origen, destino)` y `N = Math.round(t.cobertura * 100)`, la página usa `Base` con `titulo` = `{origen.nombreCorto} → {destino.nombreCorto}` y contiene:
- `<h1>De {origen.nombreCorto} a {destino.nombreCorto}</h1>`;
- `<p data-testid="resumen">Ya tienes el {N} % de lo que pide este trabajo</p>`;
- `<h2>Ya lo tienes</h2>` y una `<ul>` con un `<li data-testid="ya-tienes">` por cada `t.compartidas`: `<ChipCompetencia estado="ya-tienes" />`, `<h3>` con el nombre, la `descripcionSencilla` y `Evidencia CNPO: ` + `evidenciaOrigen` unidos con `, ` + ` → ` + `evidenciaDestino` unidos con `, ` (en `break-words text-sm text-texto-suave`). Si no hay compartidas: `Aún no encontramos competencias en común. Revisa la lista de abajo para empezar.`;
- `<h2>Por fortalecer</h2>` y una `<ul>` con un `ItemPorFortalecer` por cada `t.porFortalecer`. Si no hay: `Ya tienes todas las competencias que pide este trabajo según el CNPO.`;
- en una tarjeta `bg-aviso-fondo text-aviso-texto`: `Esta es una orientación preliminar. No evalúa ni certifica; la certificación la otorgan entidades autorizadas.`;
- un enlace `Volver a los trabajos afines` a `/ocupaciones/{origen}/`.

`e2e/transicion.spec.ts` — sobre `/transicion/caja_comercial/almacen/` comprueba: el `h1` es `De Cajero(a) de tienda a Operario(a) de almacén`; `[data-testid="resumen"]` cumple `/Ya tienes el \d{1,3} % de lo que pide este trabajo/`; cada `[data-testid="ya-tienes"]` contiene `Ya lo tienes`, un texto que cumple `/G2347002-\d+-E\d+/` y otro que cumple `/H2452001-\d+-E\d+/`; cada `[data-testid="por-fortalecer"]` contiene `Por fortalecer`, un texto que cumple `/H2452001-\d+-E\d+/`, un texto que cumple `/Busca el tema «.+» en Capacíta-T \(gratuito\)/` y un enlace con `href` `https://capacitacionlaboral.trabajo.gob.pe/`; hay al menos un elemento entre las dos listas; la página contiene `Esta es una orientación preliminar. No evalúa ni certifica; la certificación la otorgan entidades autorizadas.`; con 360 px de ancho, `scrollWidth` es menor o igual a 360. Repite las comprobaciones de `h1` y aviso en `/transicion/limpieza/housekeeping/` (`De Operario(a) de limpieza a Cuartelero(a) de hotel`) y `/transicion/salon_comidas/atencion_telefonica/` (`De Mozo(a) / ayudante de salón a Teleoperador(a)`).

Al final: `npm run format`.

**Archivos**

- `src/pages/transicion/[origen]/[destino].astro` — nuevo
- `src/components/ChipCompetencia.astro` — nuevo
- `src/components/ItemPorFortalecer.astro` — nuevo
- `e2e/transicion.spec.ts` — nuevo

**Aceptación**

Copiada del arreglo `acceptance` de esta tarea en `tasks.json` — idéntica tras quitar el énfasis markdown. Cada criterio se decide con un comando de abajo, en esta máquina, durante la construcción.

1. **WHEN** `npm run build` se ejecuta **THE SYSTEM SHALL** generar 72 páginas `dist/transicion/<origen>/<destino>/index.html` (9 orígenes × 8 destinos) y ninguna con origen igual a destino.
2. **WHEN** `/transicion/caja_comercial/almacen/` se carga **THE SYSTEM SHALL** mostrar el `h1` `De Cajero(a) de tienda a Operario(a) de almacén` y un resumen `Ya tienes el <N> % de lo que pide este trabajo`.
3. **WHEN** se lee cada competencia de la sección `Ya lo tienes` **THE SYSTEM SHALL** mostrar la etiqueta de texto `Ya lo tienes` y evidencia con ids de elemento del origen que empiezan con `G2347002-` y del destino que empiezan con `H2452001-`.
4. **WHEN** se lee cada competencia de la sección `Por fortalecer` **THE SYSTEM SHALL** mostrar la etiqueta de texto `Por fortalecer`, evidencia del destino que empieza con `H2452001-`, el texto `Busca el tema «<tema>» en Capacíta-T (gratuito)` y un enlace a `https://capacitacionlaboral.trabajo.gob.pe/`.
5. **WHEN** cualquiera de las páginas de transición probadas se carga **THE SYSTEM SHALL** mostrar `Esta es una orientación preliminar. No evalúa ni certifica; la certificación la otorgan entidades autorizadas.`
6. **WHEN** `npx playwright test e2e/transicion.spec.ts` y `npm run check` se ejecutan **THE SYSTEM SHALL** terminar ambos con código 0.

**Verify** — cada comando, en orden, desde la raíz del proyecto. Cada uno termina con 0 cuando la tarea está bien; la tarea está hecha cuando el último termina con 0.

```bash
npm run build   # expect: exit 0
test "$(ls dist/transicion/*/*/index.html | wc -l)" -eq 72   # expect: exit 0 — 9 × 8 pares ordenados
status=0; test -e dist/transicion/caja_comercial/caja_comercial/index.html || status=$?; test "$status" -eq 1   # expect: exit 0 — 1 = no existe la transición de una ocupación a sí misma
npm run check   # expect: exit 0 — astro check sin errores y biome check sin diagnósticos de error
npx playwright test e2e/transicion.spec.ts   # expect: exit 0, 0 fallidas
```

Estas líneas son el arreglo `verify` de esta tarea en `tasks.json`, una por línea, con el envoltorio de código de salida intacto (`status=0; cmd || status=$?; test "$status" -eq N`). No las "limpies".

**Checkpoint**

```bash
git add -A && git commit -m "paso 11: Páginas de transición con evidencia y cursos (E4-T4)" && git tag paso-11
```

Ejecútala después de que el último comando de **Verify** termine con 0 y antes de empezar la siguiente tarea. `paso-11` es el valor `checkpoint` de esta tarea en `tasks.json` y la marca que cuenta §20.1. Si esta tarea sale mal antes de completarse, vuelve con `git reset --hard inicio-paso-11` y reintenta, en lugar de depurar hacia adelante; nunca uses `git reset --hard paso-NN`, que borraría los commits `codex: correcciones etapa …`. Nunca inventes el tag.

---

## Aceptación de la épica

La épica está hecha cuando todas sus tareas están `done` **y**:

1. **WHEN** `npm run build` se ejecuta **THE SYSTEM SHALL** generar la portada, el directorio, 9 páginas de ranking y 72 de transición, y ningún HTML de `dist/` fuera de `dist/entrevista/` SHALL contener `<script`.
2. **WHEN** las pruebas E2E de esta épica y de `01-base` corren en `chromium` y `movil` **THE SYSTEM SHALL** pasar con 0 fallidas.

```bash
npm run build                                               # expect: exit 0
test "$(ls dist/transicion/*/*/index.html | wc -l)" -eq 72  # expect: exit 0
test -f dist/index.html   # expect: exit 0 — dist/ existe; si no, la línea siguiente pasaría en vacío
status=0; grep -rl --include='*.html' '<script' dist | grep -v '^dist/entrevista/' || status=$?; test "$status" -eq 1   # expect: exit 0 — 1 = ninguna página con script salvo la entrevista
npx playwright test e2e/esqueleto.spec.ts e2e/layout.spec.ts e2e/portada.spec.ts e2e/ocupaciones.spec.ts e2e/ocupacion.spec.ts e2e/transicion.spec.ts   # expect: exit 0
```

## Trampas

- **Reordenar en la página** — ordenar por cobertura o por demanda en el componente rompe la prueba de `data-afinidad` no creciente. Se usa el orden de `ranking()` tal cual.
- **Portada que pierde propiedades** — el paso 8 debe mantener un solo `h1`, el título `Inicio | Reconversión Laboral` y cero `img`, o fallan las pruebas de `01-base`.
- **`toLocaleString("es-PE")`** — produce `69.8` con punto; usa `formatearPorcentaje`.

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
