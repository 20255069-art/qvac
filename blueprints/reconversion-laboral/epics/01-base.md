# Épica 01: Base del sitio

> Existe un sitio Astro estático que se construye, se sirve y se prueba de punta a punta, con tokens de diseño, layout institucional y aviso de prototipo.

| | |
|---|---|
| **Id de épica** | `01-base` |
| **Tareas** | `E1-T1` (paso 1) · `E1-T2` (paso 2) |
| **Depende de** | nada — se empieza aquí (después del Bootstrap de `blueprint.md` §10) |
| **Desbloquea** | `02-datos`, `04-paginas`, `05-entrevista` |
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
  styles/global.css          # NUEVO (E1-T1) — tokens @theme y estilos base
  pages/index.astro          # NUEVO (E1-T1), se edita en E1-T2 — portada provisional
  layouts/Base.astro         # NUEVO (E1-T2) — html lang=es, título, salto, barra, aviso, pie
  components/
    AvisoPrototipo.astro     # NUEVO (E1-T2) — aviso fijo de prototipo
    PiePagina.astro          # NUEVO (E1-T2) — fuentes y aviso
e2e/
  esqueleto.spec.ts          # NUEVO (E1-T1) — el sitio construido responde y usa los tokens
  layout.spec.ts             # NUEVO (E1-T2) — idioma, título, aviso, salto, sin imágenes
package.json, astro.config.mjs, tsconfig.json, biome.json,
vitest.config.ts, playwright.config.ts, .gitignore, .nvmrc  # existen (workspace/), solo lectura
```

## Datos que toca

Ninguno. Esta épica no lee `src/data/`.

## Contratos

**Consumidos** — ya existen, no se reconstruyen:

| De | Interfaz | Garantía |
|---|---|---|
| `workspace/` (Bootstrap) | `npm run build`, `npm run preview`, `npm run check` | Definidos en `package.json`; `preview` sirve en `http://127.0.0.1:4321` |
| `workspace/` (Bootstrap) | `playwright.config.ts` | `webServer` ejecuta `npm run build && npm run preview`; proyectos `chromium` y `movil` (360×740) |

**Producidos** — las épicas siguientes dependen de estas firmas:

| Exporta | Firma | Usado por |
|---|---|---|
| `src/layouts/Base.astro` | props `{ titulo: string; descripcion: string }`, `<slot />` dentro de `main#contenido` | `04-paginas`, `05-entrevista`, `06-calidad-publicacion` |
| `src/styles/global.css` | clases de tokens: `bg-primario`, `text-texto-suave`, `max-w-contenido`, `rounded-base`, `bg-ya-tienes-fondo`… | todas |
| `src/components/AvisoPrototipo.astro` | `[data-testid="aviso-prototipo"]` con el texto del aviso | `e2e/rutas.spec.ts` (06) |

## Convenciones que muerden aquí

- Los hex de `@theme` van en minúsculas: es como los deja Biome y como los busca el `Verify`.
- `e2e/esqueleto.spec.ts` y `e2e/layout.spec.ts` deben seguir pasando cuando el paso 8 reemplace la portada: por eso solo afirman propiedades permanentes (un `h1`, título `Inicio | Reconversión Laboral`, cero `img`).
- Los enlaces dentro de la barra roja llevan `text-fondo focus-visible:outline-fondo`: el contorno azul de foco no se vería sobre el rojo.
- Sin logos, escudos ni imágenes: el logotipo es texto.

Reglas completas del proyecto: `CLAUDE.md`. Reglas de área: `.claude/rules/ui.md`. Ambos están en la raíz del proyecto desde el Bootstrap.

---

## Tareas

En el mismo orden que `tasks.json`. Ese orden es el orden de construcción: trabaja de arriba hacia abajo y no reordenes por prioridad ni por lo que parezca rápido.

### `E1-T1` — Esqueleto Astro con tokens de diseño

**Depende de:** nada · **Prioridad:** p0 — metadato para recortes de alcance, no un orden de ejecución · **Paso de `blueprint.md`:** 1

Antes de empezar: `git tag -f inicio-paso-01` (punto de retorno de esta tarea).

Crear la base visual mínima y **ejecutar el sitio construido** desde el primer paso. El Bootstrap de §10 ya copió `workspace/` (que trae `package.json`, `astro.config.mjs`, `tsconfig.json`, `biome.json`, `vitest.config.ts` y `playwright.config.ts`), instaló dependencias y Chromium. Este paso crea tres archivos con este contenido literal.

`src/styles/global.css` — los tokens de §7 dentro de `@theme` (hex en minúsculas, que es como los deja el formateador):

```css
@import "tailwindcss";
@source not "../../blueprints";
@source not "../../fuentes";

@theme {
  --color-primario: #c1121f;
  --color-primario-oscuro: #8e0e18;
  --color-texto: #1f2933;
  --color-texto-suave: #52606d;
  --color-fondo: #ffffff;
  --color-superficie: #f4f6f8;
  --color-borde: #d9dee3;
  --color-enlace: #0b5cad;
  --color-foco: #0b5cad;
  --color-ya-tienes-texto: #1e7b3a;
  --color-ya-tienes-fondo: #e6f4ea;
  --color-por-fortalecer-texto: #b54708;
  --color-por-fortalecer-fondo: #fef0e1;
  --color-aviso-texto: #5c4813;
  --color-aviso-fondo: #fff8db;
  --color-referencial-texto: #3e4c59;
  --color-referencial-fondo: #e4e7eb;
  --font-sans: system-ui, "Segoe UI", Roboto, Arial, sans-serif;
  --radius-base: 8px;
  --container-contenido: 72rem;
}

@layer base {
  body {
    background-color: var(--color-fondo);
    color: var(--color-texto);
    font-family: var(--font-sans);
    font-size: 1.125rem;
    line-height: 1.6;
  }

  h1 {
    font-size: 2rem;
    font-weight: 700;
    line-height: 1.25;
  }

  h2 {
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1.3;
  }

  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    line-height: 1.35;
  }

  a {
    color: var(--color-enlace);
    text-decoration-line: underline;
  }

  :focus-visible {
    outline: 3px solid var(--color-foco);
    outline-offset: 2px;
  }
}
```

`src/pages/index.astro` — portada provisional (el paso 2 la envuelve en el layout y el paso 8 la reemplaza):

```astro
---
import "../styles/global.css";
---

<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Inicio | Reconversión Laboral</title>
    <meta name="description" content="Prototipo de orientación para la reconversión laboral basada en el CNPO." />
  </head>
  <body class="bg-fondo text-texto">
    <main class="mx-auto max-w-contenido px-4 py-8">
      <h1>Reconversión Laboral</h1>
      <p class="text-texto-suave">Prototipo en construcción.</p>
    </main>
  </body>
</html>
```

`e2e/esqueleto.spec.ts` — corre contra el sitio que Playwright construye y sirve (`npm run build && npm run preview`, en `http://127.0.0.1:4321`). Sus aserciones son propiedades que toda versión futura de `/` mantiene, para que ningún paso posterior lo rompa:

```ts
import { expect, test } from "@playwright/test";

test("la portada construida responde 200 y tiene un solo h1 visible", async ({ page }) => {
  const respuesta = await page.goto("/");
  expect(respuesta?.status()).toBe(200);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("h1")).toBeVisible();
});

test("los tokens de global.css se aplican al body", async ({ page }) => {
  await page.goto("/");
  const estilos = await page.locator("body").evaluate((body) => {
    const calculado = getComputedStyle(body);
    return {
      fondo: calculado.backgroundColor,
      color: calculado.color,
      tamano: calculado.fontSize,
    };
  });
  expect(estilos).toEqual({
    fondo: "rgb(255, 255, 255)",
    color: "rgb(31, 41, 51)",
    tamano: "18px",
  });
});
```

Al final ejecuta `npm run format` (aplica el formato de Biome a lo que escribiste) y luego el bloque **Verify**.

**Archivos**

- `src/styles/global.css` — nuevo
- `src/pages/index.astro` — nuevo
- `e2e/esqueleto.spec.ts` — nuevo

**Aceptación**

Copiada del arreglo `acceptance` de esta tarea en `tasks.json` — idéntica tras quitar el énfasis markdown. Cada criterio se decide con un comando de abajo, en esta máquina, durante la construcción.

1. **WHEN** `npm run build` se ejecuta **THE SYSTEM SHALL** terminar con código 0 y generar `dist/index.html`.
2. **WHEN** `npx playwright test e2e/esqueleto.spec.ts` construye y sirve el sitio en `http://127.0.0.1:4321` **THE SYSTEM SHALL** responder 200 en `/` y mostrar exactamente un `h1` visible, en los proyectos `chromium` y `movil`.
3. **WHEN** `/` se carga **THE SYSTEM SHALL** aplicar al `body` los tokens de `src/styles/global.css`: fondo `rgb(255, 255, 255)`, color `rgb(31, 41, 51)` y tamaño de letra `18px`.
4. **WHEN** `src/styles/global.css` se inspecciona **THE SYSTEM SHALL** contener las líneas `@import "tailwindcss";`, `@source not "../../blueprints";`, `@source not "../../fuentes";` y `--color-primario: #c1121f;`.
5. **WHEN** `npm run check` se ejecuta **THE SYSTEM SHALL** terminar con código 0.

**Verify** — cada comando, en orden, desde la raíz del proyecto. Cada uno termina con 0 cuando la tarea está bien; la tarea está hecha cuando el último termina con 0.

```bash
npm run build   # expect: exit 0
test -f dist/index.html   # expect: exit 0 — la salida estática existe
grep -qF '@import "tailwindcss";' src/styles/global.css   # expect: exit 0
grep -qF '@source not "../../blueprints";' src/styles/global.css   # expect: exit 0 — Tailwind no escanea el bundle
grep -qF '@source not "../../fuentes";' src/styles/global.css   # expect: exit 0 — Tailwind no escanea los textos del CNPO
grep -qiF -- '--color-primario: #c1121f;' src/styles/global.css   # expect: exit 0
npm run check   # expect: exit 0 — astro check sin errores y biome check sin diagnósticos de error
npx playwright test e2e/esqueleto.spec.ts   # expect: exit 0, 0 fallidas — Playwright EJECUTA el sitio construido (npm run build && npm run preview) y lo visita
```

Estas líneas son el arreglo `verify` de esta tarea en `tasks.json`, una por línea, con el envoltorio de código de salida intacto (`status=0; cmd || status=$?; test "$status" -eq N`). No las "limpies".

**Checkpoint**

```bash
git add -A && git commit -m "paso 01: Esqueleto Astro con tokens de diseño (E1-T1)" && git tag paso-01
```

Ejecútala después de que el último comando de **Verify** termine con 0 y antes de empezar la siguiente tarea. `paso-01` es el valor `checkpoint` de esta tarea en `tasks.json` y la marca que cuenta §20.1. Si esta tarea sale mal antes de completarse, vuelve con `git reset --hard inicio-paso-01` y reintenta, en lugar de depurar hacia adelante; nunca uses `git reset --hard paso-NN`, que borraría los commits `codex: correcciones etapa …`. Nunca inventes el tag.

### `E1-T2` — Layout base con aviso, encabezado y pie

**Depende de:** `E1-T1` · **Prioridad:** p0 — metadato para recortes de alcance, no un orden de ejecución · **Paso de `blueprint.md`:** 2

Antes de empezar: `git tag -f inicio-paso-02` (punto de retorno de esta tarea).

Crear el layout que usan todas las páginas: idioma, título único, enlace para saltar al contenido, barra superior con el logotipo de texto, aviso fijo de prototipo y pie con fuentes. Sin logos, escudos ni imágenes.

`src/layouts/Base.astro`:

```astro
---
import AvisoPrototipo from "../components/AvisoPrototipo.astro";
import PiePagina from "../components/PiePagina.astro";
import "../styles/global.css";

interface Props {
  titulo: string;
  descripcion: string;
}

const { titulo, descripcion } = Astro.props;
---

<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{titulo} | Reconversión Laboral</title>
    <meta name="description" content={descripcion} />
  </head>
  <body class="bg-fondo text-texto">
    <a href="#contenido" class="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-base focus:bg-fondo focus:px-4 focus:py-3">Saltar al contenido</a>
    <header class="bg-primario text-fondo">
      <div class="mx-auto flex max-w-contenido flex-wrap items-center justify-between gap-2 px-4 py-3">
        <a href="/" class="text-xl font-bold text-fondo no-underline focus-visible:outline-fondo">Reconversión Laboral</a>
        <nav aria-label="Principal">
          <ul class="flex flex-wrap gap-x-4 gap-y-1">
            <li><a href="/ocupaciones/" class="text-fondo focus-visible:outline-fondo">Ocupaciones</a></li>
            <li><a href="/entrevista/" class="text-fondo focus-visible:outline-fondo">Entrevista</a></li>
            <li><a href="/acerca/" class="text-fondo focus-visible:outline-fondo">Cómo funciona</a></li>
          </ul>
        </nav>
      </div>
    </header>
    <AvisoPrototipo />
    <main id="contenido" tabindex="-1" class="mx-auto max-w-contenido px-4 py-8">
      <slot />
    </main>
    <PiePagina />
  </body>
</html>
```

`src/components/AvisoPrototipo.astro`:

```astro
<div data-testid="aviso-prototipo" class="border-b border-borde bg-aviso-fondo text-aviso-texto">
  <p class="mx-auto max-w-contenido px-4 py-2 text-base">
    <strong>Prototipo para el Innovathon Ulima x Tether.</strong> No es un sitio oficial del Estado peruano.
  </p>
</div>
```

`src/components/PiePagina.astro`:

```astro
<footer class="mt-12 border-t border-borde bg-superficie">
  <div class="mx-auto max-w-contenido space-y-2 px-4 py-6 text-base text-texto-suave">
    <p>
      Fuentes: Catálogo Nacional de Perfiles Ocupacionales (CNPO) del Ministerio de Trabajo y Promoción del
      Empleo (MTPE); IEES (Sociedad Nacional de Industrias) con datos del INEI.
    </p>
    <p>Prototipo para el Innovathon Ulima x Tether. No es un sitio oficial del Estado peruano.</p>
    <p>La orientación es preliminar: no evalúa ni certifica competencias.</p>
    <p><a href="/acerca/">Cómo funciona este prototipo</a></p>
  </div>
</footer>
```

`src/pages/index.astro` (reemplaza el contenido del paso 1):

```astro
---
import Base from "../layouts/Base.astro";
---

<Base titulo="Inicio" descripcion="Descubre a qué trabajos afines puedes pasar con lo que ya sabes hacer, según el CNPO.">
  <h1>Reconversión Laboral</h1>
  <p class="text-texto-suave">Prototipo en construcción.</p>
</Base>
```

`e2e/layout.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

const AVISO =
  "Prototipo para el Innovathon Ulima x Tether. No es un sitio oficial del Estado peruano.";

test("el layout fija idioma, título, aviso y fuentes", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(page).toHaveTitle("Inicio | Reconversión Laboral");
  await expect(page.getByTestId("aviso-prototipo")).toContainText(AVISO);
  await expect(page.locator("footer")).toContainText(
    "Catálogo Nacional de Perfiles Ocupacionales (CNPO)",
  );
  await expect(page.locator("img")).toHaveCount(0);
});

test("el primer Tab enfoca el enlace para saltar al contenido", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const enfocado = page.locator(":focus");
  await expect(enfocado).toHaveText("Saltar al contenido");
  await expect(enfocado).toHaveAttribute("href", "#contenido");
  await expect(page.locator("main#contenido")).toHaveCount(1);
});
```

Al final: `npm run format`.

**Archivos**

- `src/layouts/Base.astro` — nuevo
- `src/components/AvisoPrototipo.astro` — nuevo
- `src/components/PiePagina.astro` — nuevo
- `src/pages/index.astro` — edición
- `e2e/layout.spec.ts` — nuevo

**Aceptación**

Copiada del arreglo `acceptance` de esta tarea en `tasks.json` — idéntica tras quitar el énfasis markdown. Cada criterio se decide con un comando de abajo, en esta máquina, durante la construcción.

1. **WHEN** `/` se carga **THE SYSTEM SHALL** mostrar en `[data-testid="aviso-prototipo"]` el texto `Prototipo para el Innovathon Ulima x Tether. No es un sitio oficial del Estado peruano.`
2. **WHEN** `/` se carga **THE SYSTEM SHALL** tener `<html lang="es">` y el título `Inicio | Reconversión Laboral`.
3. **WHEN** se presiona Tab una vez en `/` **THE SYSTEM SHALL** enfocar el enlace `Saltar al contenido` con `href="#contenido"`, y la página SHALL tener exactamente un `main#contenido`.
4. **WHEN** `/` se carga **THE SYSTEM SHALL** mostrar en el `footer` el texto `Catálogo Nacional de Perfiles Ocupacionales (CNPO)` y no contener ningún elemento `img`.
5. **WHEN** `npx playwright test e2e/esqueleto.spec.ts e2e/layout.spec.ts` y `npm run check` se ejecutan **THE SYSTEM SHALL** terminar ambos con código 0.

**Verify** — cada comando, en orden, desde la raíz del proyecto. Cada uno termina con 0 cuando la tarea está bien; la tarea está hecha cuando el último termina con 0.

```bash
npm run check   # expect: exit 0 — astro check sin errores y biome check sin diagnósticos de error
npx playwright test e2e/esqueleto.spec.ts e2e/layout.spec.ts   # expect: exit 0, 0 fallidas — el esqueleto del paso 1 sigue pasando
```

Estas líneas son el arreglo `verify` de esta tarea en `tasks.json`, una por línea, con el envoltorio de código de salida intacto (`status=0; cmd || status=$?; test "$status" -eq N`). No las "limpies".

**Checkpoint**

```bash
git add -A && git commit -m "paso 02: Layout base con aviso, encabezado y pie (E1-T2)" && git tag paso-02
```

Ejecútala después de que el último comando de **Verify** termine con 0 y antes de empezar la siguiente tarea. `paso-02` es el valor `checkpoint` de esta tarea en `tasks.json` y la marca que cuenta §20.1. Si esta tarea sale mal antes de completarse, vuelve con `git reset --hard inicio-paso-02` y reintenta, en lugar de depurar hacia adelante; nunca uses `git reset --hard paso-NN`, que borraría los commits `codex: correcciones etapa …`. Nunca inventes el tag.

---

## Aceptación de la épica

La épica está hecha cuando todas sus tareas están `done` **y**:

1. **WHEN** Playwright construye y sirve el sitio **THE SYSTEM SHALL** responder 200 en `/` con el layout completo (aviso, salto al contenido, pie) en `chromium` y en `movil`.
2. **WHEN** se ejecuta la puerta de calidad sobre el árbol con la carpeta `blueprints/` presente **THE SYSTEM SHALL** terminar con código 0, porque `biome.json` y `tsconfig.json` la excluyen.

```bash
npm run check                                                   # expect: exit 0
npx playwright test e2e/esqueleto.spec.ts e2e/layout.spec.ts     # expect: exit 0, 0 fallidas
```

## Trampas

- **Puerto 4321 ocupado** — si quedó un `npm run preview` o `npm run dev` abierto, `webServer` falla (`reuseExistingServer: false`). Cierra ese proceso; no cambies la configuración.
- **Formato** — Biome exige su formato en `.astro`, `.ts`, `.css` y `.json`. Ejecuta `npm run format` antes de `npm run check`; nunca desactives reglas para pasar.
- **Node fuera del PATH de Git Bash** — si `npm` responde "command not found", aplica la línea de prerrequisitos de `CLAUDE.md`; no instales otro Node.

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
