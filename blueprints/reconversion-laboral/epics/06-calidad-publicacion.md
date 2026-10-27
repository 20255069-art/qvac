# Épica 06: Calidad y publicación

> Todo el sitio pasa rutas, axe y ancho móvil, tiene metodología y 404, y queda listo para que una persona lo publique en Cloudflare Pages.

| | |
|---|---|
| **Id de épica** | `06-calidad-publicacion` |
| **Tareas** | `E6-T1` (paso 14) · `E6-T2` (paso 15) |
| **Depende de** | `04-paginas` y `05-entrevista` |
| **Desbloquea** | la lista de lanzamiento humana de `blueprint.md` §20.1 |
| **En paralelo con** | nada: es la última épica |

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
src/pages/
  acerca.astro               # NUEVO (E6-T1) — metodología, fuentes y límites
  404.astro                  # NUEVO (E6-T1)
e2e/
  rutas.spec.ts              # NUEVO (E6-T1) — 10 rutas + 404
  accesibilidad.spec.ts      # NUEVO (E6-T1) — axe + 360 px en 5 páginas (literal)
public/_headers              # NUEVO (E6-T2) — cabeceras de seguridad de Cloudflare Pages
docs/PUBLICAR.md             # NUEVO (E6-T2) — guía humana de publicación
```

## Datos que toca

`acerca.astro` lee `ocupaciones` y `contexto` de `src/lib/datos.ts` para listar las 9 ocupaciones y la fuente. Nada más.

## Contratos

**Consumidos:** todas las rutas de `04-paginas` y `05-entrevista`; `[data-testid="aviso-prototipo"]` de `01-base`; el script `deploy` y `wrangler` de `package.json` (de `workspace/`).

**Producidos:**

| Exporta | Firma | Usado por |
|---|---|---|
| `dist/_headers` | cabeceras para `/*` | Cloudflare Pages al publicar |
| `docs/PUBLICAR.md` | pasos humanos: `npx wrangler login`, `npm run deploy`, rollback | la persona que publica (lista de lanzamiento) |

## Convenciones que muerden aquí

- Una violación de axe se corrige en la página o el componente; nunca se quita una etiqueta ni se filtra una regla.
- Este paso **no publica**: `npm run deploy` y `npx wrangler login` están prohibidos para el agente (denegados en `.claude/settings.json`).
- `script-src` incluye `'unsafe-inline'` porque Astro hidrata la isla con un script en línea; quitarlo rompería la entrevista en producción, y ninguna prueba local lo detectaría porque `astro preview` no aplica `_headers`.

Reglas completas: `CLAUDE.md`. Reglas de área: `.claude/rules/ui.md`.

---

## Tareas

En el mismo orden que `tasks.json`. Ese orden es el orden de construcción: trabaja de arriba hacia abajo y no reordenes por prioridad ni por lo que parezca rápido.

### `E6-T1` — Metodología, 404, accesibilidad y E2E completo

**Depende de:** `E4-T1`, `E4-T4`, `E5-T2` · **Prioridad:** p0 — metadato para recortes de alcance, no un orden de ejecución · **Paso de `blueprint.md`:** 14

Antes de empezar: `git tag -f inicio-paso-14` (punto de retorno de esta tarea).

Cerrar el recorrido con la página de metodología y la de error, y cubrir todo el sitio con las pruebas de rutas, accesibilidad (axe) y ancho móvil.

`src/pages/acerca.astro` — `Base` con `titulo="Cómo funciona"` y `descripcion="Metodología, fuentes y límites del prototipo de reconversión laboral."`. Contiene `<h1>Cómo funciona este prototipo</h1>` y estas secciones `<h2>`, con estos contenidos:
- **Qué hace**: orienta, a partir del CNPO, sobre trabajos afines; es una orientación preliminar que no evalúa ni certifica; la certificación la otorgan entidades autorizadas.
- **Cómo calculamos la afinidad**: en lenguaje simple — cada competencia técnica vale 1 punto y cada transversal 0,5; "cuánto ya tienes" (cobertura) es la parte de lo que pide el trabajo destino que ya está en tu ocupación; "parecido general" compara ambos trabajos completos; la afinidad es el promedio de las dos y ordena la lista. La demanda no cambia el orden.
- **Fuentes**: Catálogo Nacional de Perfiles Ocupacionales (CNPO) del MTPE, con una lista de las 9 ocupaciones (`nombreCorto` y `codigo`, leídas de `datos.ts`); dato de informalidad de `contexto.fuente`; cursos en el portal Capacíta-T (`https://capacitacionlaboral.trabajo.gob.pe/`).
- **Demanda referencial**: el nivel Alta/Media/Baja es ilustrativo, definido por el equipo, y se reemplazará con la Encuesta de Demanda Ocupacional 2026 del MTPE.
- **Qué no incluye todavía**: la ocupación Compras (`H2452004`) quedó fuera porque su PDF es un escaneo sin texto; solo se consideran estándares de nivel operativo; la entrevista usa palabras clave en lugar de la IA local QVAC de Tether.
- **Aviso**: Prototipo para el Innovathon Ulima x Tether. No es un sitio oficial del Estado peruano.

`src/pages/404.astro` — `Base` con `titulo="Página no encontrada"`; `<h1>No encontramos esta página</h1>`, el párrafo `Puede que el enlace esté mal escrito o que la página ya no exista.` y un enlace `Volver al inicio` a `/`.

`e2e/rutas.spec.ts` — para cada fila, `page.goto(ruta)` responde 200 y el `h1` tiene exactamente el texto indicado:

| Ruta | `h1` |
|---|---|
| `/` | `Lo que ya sabes hacer vale en otros trabajos` |
| `/ocupaciones/` | `Elige tu ocupación` |
| `/ocupaciones/caja_comercial/` | `De Cajero(a) de tienda a otros trabajos` |
| `/ocupaciones/limpieza/` | `De Operario(a) de limpieza a otros trabajos` |
| `/ocupaciones/salon_comidas/` | `De Mozo(a) / ayudante de salón a otros trabajos` |
| `/transicion/caja_comercial/almacen/` | `De Cajero(a) de tienda a Operario(a) de almacén` |
| `/transicion/limpieza/housekeeping/` | `De Operario(a) de limpieza a Cuartelero(a) de hotel` |
| `/transicion/salon_comidas/atencion_telefonica/` | `De Mozo(a) / ayudante de salón a Teleoperador(a)` |
| `/entrevista/` | `Cuéntanos tu experiencia` |
| `/acerca/` | `Cómo funciona este prototipo` |

Además: `/ruta-que-no-existe/` muestra el texto `No encontramos esta página` y un enlace `Volver al inicio` con `href` `/`; `/acerca/` contiene `CNPO`, `Demanda referencial` y `H2452004`. Cada página de la tabla muestra el aviso `Prototipo para el Innovathon Ulima x Tether. No es un sitio oficial del Estado peruano.` en `[data-testid="aviso-prototipo"]`.

`e2e/accesibilidad.spec.ts` — contenido literal:

```ts
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PAGINAS = [
  "/",
  "/ocupaciones/",
  "/ocupaciones/caja_comercial/",
  "/transicion/caja_comercial/almacen/",
  "/entrevista/",
];

for (const ruta of PAGINAS) {
  test(`axe sin violaciones serias ni críticas en ${ruta}`, async ({ page }) => {
    await page.goto(ruta);
    const resultado = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const graves = resultado.violations.filter(
      (violacion) => violacion.impact === "critical" || violacion.impact === "serious",
    );
    expect(graves.map((violacion) => `${violacion.id}: ${violacion.help}`)).toEqual([]);
  });

  test(`sin scroll horizontal a 360 px en ${ruta}`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto(ruta);
    const ancho = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(ancho).toBeLessThanOrEqual(360);
  });
}
```

Si axe reporta una violación, se corrige la página o el componente; nunca se quita una etiqueta ni se filtra la regla. Al final: `npm run format`.

**Archivos**

- `src/pages/acerca.astro` — nuevo
- `src/pages/404.astro` — nuevo
- `e2e/rutas.spec.ts` — nuevo
- `e2e/accesibilidad.spec.ts` — nuevo

**Aceptación**

Copiada del arreglo `acceptance` de esta tarea en `tasks.json` — idéntica tras quitar el énfasis markdown. Cada criterio se decide con un comando de abajo, en esta máquina, durante la construcción.

1. **WHEN** `e2e/rutas.spec.ts` visita `/`, `/ocupaciones/`, `/ocupaciones/caja_comercial/`, `/ocupaciones/limpieza/`, `/ocupaciones/salon_comidas/`, `/transicion/caja_comercial/almacen/`, `/transicion/limpieza/housekeeping/`, `/transicion/salon_comidas/atencion_telefonica/`, `/entrevista/` y `/acerca/` **THE SYSTEM SHALL** responder 200 en cada una y mostrar su `h1` esperado y el aviso de prototipo.
2. **WHEN** se visita `/ruta-que-no-existe/` **THE SYSTEM SHALL** mostrar el texto `No encontramos esta página` y un enlace `Volver al inicio` a `/`.
3. **WHEN** `/acerca/` se carga **THE SYSTEM SHALL** contener `CNPO`, `Demanda referencial` y `H2452004`.
4. **WHEN** `e2e/accesibilidad.spec.ts` ejecuta axe con las etiquetas `wcag2a` y `wcag2aa` sobre `/`, `/ocupaciones/`, `/ocupaciones/caja_comercial/`, `/transicion/caja_comercial/almacen/` y `/entrevista/` **THE SYSTEM SHALL** encontrar 0 violaciones de impacto `critical` o `serious`.
5. **WHEN** esas 5 páginas se abren con 360 px de ancho **THE SYSTEM SHALL** tener `document.documentElement.scrollWidth` menor o igual a 360 en todas.
6. **WHEN** `npm run check`, `npm test` y `npx playwright test` se ejecutan **THE SYSTEM SHALL** terminar los tres con código 0.

**Verify** — cada comando, en orden, desde la raíz del proyecto. Cada uno termina con 0 cuando la tarea está bien; la tarea está hecha cuando el último termina con 0.

```bash
npm run check   # expect: exit 0 — astro check sin errores y biome check sin diagnósticos de error
npm test   # expect: exit 0, 0 fallidas
npx playwright test   # expect: exit 0, 0 fallidas — toda la carpeta e2e/, en chromium y movil
test -f dist/404.html   # expect: exit 0 — Playwright dejó construido el sitio con la página 404
```

Estas líneas son el arreglo `verify` de esta tarea en `tasks.json`, una por línea, con el envoltorio de código de salida intacto (`status=0; cmd || status=$?; test "$status" -eq N`). No las "limpies".

**Checkpoint**

```bash
git add -A && git commit -m "paso 14: Metodología, 404, accesibilidad y E2E completo (E6-T1)" && git tag paso-14
```

Ejecútala después de que el último comando de **Verify** termine con 0 y antes de empezar la siguiente tarea. `paso-14` es el valor `checkpoint` de esta tarea en `tasks.json` y la marca que cuenta §20.1. Si esta tarea sale mal antes de completarse, vuelve con `git reset --hard inicio-paso-14` y reintenta, en lugar de depurar hacia adelante; nunca uses `git reset --hard paso-NN`, que borraría los commits `codex: correcciones etapa …`. Nunca inventes el tag.

### `E6-T2` — Preparación de la publicación en Cloudflare Pages

**Depende de:** `E6-T1` · **Prioridad:** p1 — metadato para recortes de alcance, no un orden de ejecución · **Paso de `blueprint.md`:** 15

Antes de empezar: `git tag -f inicio-paso-15` (punto de retorno de esta tarea).

Dejar el sitio listo para que una persona lo publique en Cloudflare Pages con un solo comando. Este paso **no publica**: el inicio de sesión (`npx wrangler login`) y el primer despliegue real son pasos humanos de la lista de lanzamiento de §20.1.

`public/_headers` — contenido literal (Cloudflare Pages aplica este archivo; Astro lo copia tal cual a `dist/_headers`). `script-src` permite `'unsafe-inline'` porque Astro inserta un script en línea para hidratar la isla de la entrevista:

```text
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
```

`docs/PUBLICAR.md` — guía en español para una persona sin experiencia, con estas secciones y comandos literales:
1. **Una sola vez:** crear una cuenta gratuita en `https://dash.cloudflare.com/sign-up` (plan Free, $0, uso comercial permitido); en Git Bash, en la raíz del proyecto, ejecutar `npx wrangler login` y aceptar en el navegador.
2. **Publicar:** `npm run deploy` (construye y sube `dist/` al proyecto `reconversion-laboral`, rama `main`). La primera vez, wrangler crea el proyecto; la URL queda como `https://reconversion-laboral.pages.dev` o, si ese nombre ya está tomado, la que wrangler imprima terminada en `.pages.dev`.
3. **Comprobar:** abrir la URL en el celular, recorrer portada → ocupaciones → una transición → entrevista, y confirmar que aparece el aviso de prototipo.
4. **Volver a una versión anterior:** en el panel de Cloudflare Pages, pestaña *Deployments*, elegir un despliegue anterior y *Rollback to this deployment*; o en Git Bash `git checkout paso-15 && npm run deploy && git checkout main`.
5. **Revisar enlaces antes del Demo Day:** `npm run verificar-enlaces` (necesita internet).
6. **Opcional:** guardar capturas de referencia de Stitch en `docs/referencias/*.png`; son solo referencia visual.

`package.json` ya trae el script `deploy` (`npm run build && wrangler pages deploy dist --project-name=reconversion-laboral --branch=main`) y `wrangler` como dependencia de desarrollo: este paso no los toca. Al final: `npm run format`.

**Archivos**

- `public/_headers` — nuevo
- `docs/PUBLICAR.md` — nuevo

**Aceptación**

Copiada del arreglo `acceptance` de esta tarea en `tasks.json` — idéntica tras quitar el énfasis markdown. Cada criterio se decide con un comando de abajo, en esta máquina, durante la construcción.

1. **WHEN** `npm run build` se ejecuta **THE SYSTEM SHALL** copiar `public/_headers` a `dist/_headers`.
2. **WHEN** se lee `dist/_headers` **THE SYSTEM SHALL** contener las cabeceras `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` y `Content-Security-Policy:` para la ruta `/*`.
3. **WHEN** `npx wrangler --version` se ejecuta **THE SYSTEM SHALL** terminar con código 0 usando el wrangler local instalado desde `package.json`.
4. **WHEN** se lee `docs/PUBLICAR.md` **THE SYSTEM SHALL** contener los comandos `npx wrangler login` y `npm run deploy` y el dominio `.pages.dev`.
5. **WHEN** `npm run check` se ejecuta **THE SYSTEM SHALL** terminar con código 0.

**Verify** — cada comando, en orden, desde la raíz del proyecto. Cada uno termina con 0 cuando la tarea está bien; la tarea está hecha cuando el último termina con 0.

```bash
npm run build   # expect: exit 0
test -f dist/_headers   # expect: exit 0
grep -qF 'X-Content-Type-Options: nosniff' dist/_headers   # expect: exit 0
grep -qF 'X-Frame-Options: DENY' dist/_headers   # expect: exit 0
grep -qF 'Referrer-Policy: strict-origin-when-cross-origin' dist/_headers   # expect: exit 0
grep -qF 'Content-Security-Policy:' dist/_headers   # expect: exit 0
npx wrangler --version   # expect: exit 0 — imprime la versión fijada en §11; no inicia sesión ni publica
grep -qF 'npx wrangler login' docs/PUBLICAR.md   # expect: exit 0
grep -qF 'npm run deploy' docs/PUBLICAR.md   # expect: exit 0
grep -qF '.pages.dev' docs/PUBLICAR.md   # expect: exit 0
npm run check   # expect: exit 0 — astro check sin errores y biome check sin diagnósticos de error
```

Estas líneas son el arreglo `verify` de esta tarea en `tasks.json`, una por línea, con el envoltorio de código de salida intacto (`status=0; cmd || status=$?; test "$status" -eq N`). No las "limpies".

**Checkpoint**

```bash
git add -A && git commit -m "paso 15: Preparación de la publicación en Cloudflare Pages (E6-T2)" && git tag paso-15
```

Ejecútala después de que el último comando de **Verify** termine con 0 y antes de empezar la siguiente tarea. `paso-15` es el valor `checkpoint` de esta tarea en `tasks.json` y la marca que cuenta §20.1. Si esta tarea sale mal antes de completarse, vuelve con `git reset --hard inicio-paso-15` y reintenta, en lugar de depurar hacia adelante; nunca uses `git reset --hard paso-NN`, que borraría los commits `codex: correcciones etapa …`. Nunca inventes el tag.

---

## Aceptación de la épica

La épica está hecha cuando todas sus tareas están `done` **y**:

1. **WHEN** `npm run check`, `npm test` y `npx playwright test` se ejecutan desde la raíz del proyecto **THE SYSTEM SHALL** terminar los tres con código 0.
2. **WHEN** `npm run build` se ejecuta **THE SYSTEM SHALL** dejar en `dist/` la página 404 y `_headers` listos para Cloudflare Pages.

```bash
npm run check          # expect: exit 0
npm test               # expect: exit 0
npx playwright test    # expect: exit 0
test -f dist/404.html                              # expect: exit 0 — paso 14
test -f dist/_headers                              # expect: exit 0 — paso 15
npx wrangler --version                             # expect: exit 0
```

## Trampas

- **Probar `_headers` con `astro preview`** — no se aplica localmente; se comprueba en `dist/_headers` y, tras publicar, en la lista de lanzamiento.
- **Contraste en tarjetas de aviso** — `text-aviso-texto` sobre `bg-aviso-fondo` cumple 8,2:1; no uses `text-texto-suave` sobre `bg-aviso-fondo` sin revisar.
- **404 con estado** — la prueba comprueba el texto, no el código HTTP: `astro preview` y Cloudflare Pages sirven `404.html` a su manera.

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
