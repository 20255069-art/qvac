# Reconversión Laboral — prototipo

Sitio estático (Astro + islas React) con una función de Cloudflare Pages (`functions/api/traducir.ts`) como puente hacia QVAC, donde un trabajador elige su ocupación y ve a qué ocupaciones afines puede pasar, qué competencias ya tiene y cuáles debe fortalecer, con sustento en el Catálogo Nacional de Perfiles Ocupacionales (CNPO) del MTPE. Prototipo para el jurado del Demo Day del Innovathon Ulima x Tether (30-oct-2026).

## Comandos

Todo se ejecuta desde la raíz del proyecto, en Git Bash. Si `node -v` responde "command not found", el directorio de Node no está en el PATH de Git Bash: ejecuta una vez `echo 'export PATH="/c/Program Files/nodejs:$PATH"' >> ~/.bashrc` y abre una sesión nueva.

| Tarea | Comando |
|---|---|
| Instalar dependencias | `npm install` · instalación limpia: `npm ci` |
| Navegador para E2E (una vez) | `npx playwright install chromium` |
| Servidor de desarrollo | `npm run dev` — http://localhost:4321 |
| Construir | `npm run build` → `dist/` |
| Servir lo construido | `npm run preview` — http://127.0.0.1:4321 |
| Tipos + lint + formato (puerta) | `npm run check` (`astro check && biome check .`) |
| Formatear y autocorregir | `npm run format` (`biome check --write .`) |
| Pruebas unitarias | `npm test` · un archivo: `npx vitest run tests/<archivo>.test.ts` |
| E2E (+ axe) | `npm run test:e2e` · un archivo: `npx playwright test e2e/<archivo>.spec.ts` |
| Copiar los 9 PDF del CNPO | `npm run copiar-perfiles` (origen: `PERFILES_ORIGEN`, o la ruta por defecto del script) |
| Extraer texto de los PDF | `npm run extraer` → `fuentes/texto/*.txt` |
| Revisar enlaces de cursos (usa red) | `npm run verificar-enlaces` · sin red: `node scripts/verificar-enlaces.mjs --solo-listar` |
| Publicar en Cloudflare Pages | `npm run deploy` — **solo una persona**, después de `npx wrangler login`. Nunca un agente. |

**Puerta antes de marcar una tarea como hecha:** `npm run format && npm run check` en verde, más `npm test` a partir del paso 3 (antes no hay pruebas unitarias y falla a propósito), más los `verify` de la tarea en `blueprints/reconversion-laboral/tasks.json`. Los E2E levantan el sitio solos (`npm run build && npm run preview`): no dejes otro proceso usando el puerto 4321.

**Construcción secuencial y punto de retorno:** un solo agente, una tarea a la vez, en el orden de `tasks.json`. Al empezar cada paso ejecuta `git tag -f inicio-paso-NN` (NN = número del paso que empiezas). Si el paso sale mal, `git reset --hard inicio-paso-NN` y reintenta: así no se pierden los commits `codex: correcciones etapa …` hechos entre pasos. Nunca uses `git reset --hard paso-NN`.

Node fijado en `.nvmrc` (24). Las versiones exactas están en `package.json` y `package-lock.json`: léelas, nunca las adivines. `package.json` lo escribe el plano; no le agregues dependencias.

## Stack

Astro (salida estática) · función de Cloudflare Pages para `/api/traducir` · TypeScript · islas React solo con interacción · Tailwind CSS 4 (CSS-first, `@theme`) · zod · Vitest · Playwright + axe · Biome · npm · QVAC (motor IA local-first de Tether con fallback determinista).

## Arquitectura

**Camino de un dato.** PDF del CNPO (`fuentes/perfiles/`) → `scripts/extraer-texto.mjs` → `fuentes/texto/*.txt` → el equipo/constructor redacta `src/data/*.json` citando ids de elemento → `src/lib/datos.ts` valida todo con los esquemas de `src/lib/esquemas.ts` al construir → `src/lib/afinidad.ts` calcula transiciones → las páginas `src/pages/**` generan HTML prerenderizado en `dist/`.

**Camino de la entrevista.** `src/pages/entrevista.astro` pasa datos mínimos como props a la isla `src/components/islas/Entrevista.tsx` (`client:load`) → `src/lib/traductor/qvac.ts` envía el relato mediante `fetch('/api/traducir')` a la función de Cloudflare Pages `functions/api/traducir.ts`, que consulta al motor de IA local-first QVAC (`src/lib/traductor/qvac-protocolo.ts`) validando determinísticamente contra `C01`–`C30`, y activa automáticamente `src/lib/traductor/palabras-clave.ts` como fallback local si QVAC no está disponible → `src/lib/sugerencias.ts` sugiere 3 ocupaciones. Nada se persiste (`localStorage`/`sessionStorage` permanecen vacíos).

| Capa | Puede importar de | Nunca |
|---|---|---|
| `src/pages/**`, `src/layouts/**` | `components`, `lib`, `styles` | Lógica de cálculo inline: se llama a `src/lib/` |
| `src/components/**` (Astro) | `lib` (solo tipos y formato) | Leer `src/data/*.json` directamente |
| `src/components/islas/**` (React) | `lib/traductor`, `lib/sugerencias`, `lib/formato` | `src/lib/datos.ts` o los JSON (llegan por props) |
| `src/lib/**` | `src/data/*.json` (solo `datos.ts`), otros `lib` | React, Astro, `node:*` |
| `scripts/*.mjs` | `node:*`, `pdfjs-dist` | Importar algo de `src/` (leen JSON con `node:fs`) |
| `tests/**` (Vitest) | `src/lib/**`, `src/data/**`, `tests/fixtures/**` | `e2e/**` |
| `e2e/**` (Playwright) | `@playwright/test`, `@axe-core/playwright` | Cualquier módulo de `src/` |

**Dónde vive cada cosa.**

| Tema | Fuente única de verdad |
|---|---|
| Esquemas y tipos de datos | `src/lib/esquemas.ts` (tipos con `z.infer`) |
| Carga y validación de datos | `src/lib/datos.ts` — único archivo que importa `src/data/*.json` en la app |
| Fórmula de afinidad | `src/lib/afinidad.ts` (`crearMotor`, `calcularTransicion`, `ranking`) |
| Traductor de relatos | `src/lib/traductor/tipos.ts` (contrato) + `qvac.ts` (adaptador QVAC con fallback) + `qvac-protocolo.ts` (cliente/validador SSR) + `palabras-clave.ts` (fallback determinista) |
| Puente a QVAC | `functions/api/traducir.ts` (función de Cloudflare Pages; en local: `npm run build && npx wrangler pages dev dist`) |
| Tokens de diseño | `src/styles/global.css` (`@theme`) |
| Textos legales fijos | `src/components/AvisoPrototipo.astro` y `src/components/PiePagina.astro` |
| URL de capacitación | `URL_CAPACITA_T` en `src/lib/esquemas.ts` = `https://capacitacionlaboral.trabajo.gob.pe/` |

## Reglas de código

1. **Importaciones relativas con extensión explícita:** `../lib/afinidad.ts`, `./islas/Entrevista.tsx`, `../data/mapeo.json`. Sin alias `@/`. Tipos con `import type`.
2. **Un componente por archivo, máximo 200 líneas.** Más largo: dividir por responsabilidad.
3. **Islas solo donde hay interacción.** Hoy solo existe una (`Entrevista.tsx`). Toda otra página sale sin `<script>`.
4. **Datos validados al construir.** Si un JSON no cumple su esquema, `npm run build` debe fallar; nunca se "arregla" con valores por defecto.
5. **El ranking ordena por afinidad, nunca por demanda.** La demanda es ilustrativa y se muestra como "Demanda referencial".
6. **Funciones puras e inyectables** en `src/lib/`: `crearMotor(datos)` y `crearTraductorPalabrasClave(competencias)` reciben sus datos para poder probarse con `tests/fixtures/datos-minimos.ts`.
7. **Botones con `type` explícito** (`type="button"` o `type="submit"`) y todo campo con `<label>`.
8. **Copia en español del Perú**, trato de "tú", frases cortas. La IA es declarativa: la interfaz nunca dice que evalúa o certifica.

## Sistema de diseño

Tokens en `src/styles/global.css` dentro de `@theme`. Usa las clases de Tailwind que generan (`bg-primario`, `text-texto-suave`, `max-w-contenido`, `rounded-base`); nunca hex sueltos en componentes.

| Token | Valor | Uso |
|---|---|---|
| `primario` / `primario-oscuro` | `#0B5CAD` / `#08457F` | Barra superior, botones, números y acentos (azul estilo gob.pe; **nunca rojo en la interfaz**) / hover |
| `texto` / `texto-suave` | `#1F2933` / `#52606D` | Texto / textos secundarios |
| `fondo` / `superficie` / `borde` | `#FFFFFF` / `#F2F6FB` / `#D9DEE3` | Página / tarjetas y pie / bordes de 1px |
| `enlace` / `foco` | `#0B5CAD` / `#0B5CAD` | Enlaces / contorno de foco de 3px |
| `ya-tienes-texto` / `ya-tienes-fondo` | `#1E7B3A` / `#E6F4EA` | Competencias que ya tiene |
| `por-fortalecer-texto` / `por-fortalecer-fondo` | `#B54708` / `#FEF0E1` | Competencias por fortalecer |
| `celeste-fondo` | `#E6F0FA` | Fondos de acento (números de pasos) |
| `icono-trazo` / `icono-relleno` / `icono-acento` | `#4A3B78` / `#FDE8EC` / `#D6283C` | Solo dentro de los íconos de ocupación (el rojo existe solo aquí) |
| `aviso-texto` / `aviso-fondo` | `#5C4813` / `#FFF8DB` | Aviso de prototipo |
| `referencial-texto` / `referencial-fondo` | `#3E4C59` / `#E4E7EB` | Insignia "Demanda referencial" |

- **Letra:** `system-ui, "Segoe UI", Roboto, Arial, sans-serif`; sin fuentes web ni peticiones externas. Base 18px / 1.6; h1 2rem 700, h2 1.5rem 700, h3 1.25rem 600.
- **Espaciado:** escala de 4px de Tailwind. **Radio:** 8px (`rounded-base`). **Cajas (estilo gob.pe):** fondo de página gris (`superficie`); toda oración va dentro de una `.caja` blanca (borde 1px y sombra suave `--shadow-caja`); fuera de las cajas solo títulos cortos. El aviso de prototipo va al pie de cada página.
- **Botones:** `min-h-12` (48px), ancho completo en móvil (`w-full sm:w-auto`).
- **Diseño:** móvil primero (360px), ancho máximo `max-w-contenido` (72rem), sin scroll horizontal a 360px.
- **Color nunca es la única señal:** cada chip lleva su texto ("Ya lo tienes" / "Por fortalecer").
- **Animación solo en los íconos de ocupación**, con CSS (se dibujan al cargar; saltan y destellan al pasar el cursor o enfocar) y desactivada con `prefers-reduced-motion`. Sin JavaScript para animar. Sin logos, escudos ni marcas de gob.pe: solo el logotipo de texto "Reconversión Laboral".
- **Stitch (Google) es solo referencia visual opcional:** si existen `docs/referencias/*.png` puedes mirarlas para la disposición; los tokens de esta tabla siempre ganan y nunca se pega código de Stitch.

## Entorno

| Variable | Requerida | Usada por | Origen |
|---|---|---|---|
| `PERFILES_ORIGEN` | no | `scripts/copiar-perfiles.mjs` | Carpeta con los PDF del CNPO; por defecto `C:/Users/Home/Pictures/TETHER/innova/perfiles - copia` |
| `CLAUDE_PROJECT_DIR` | no | `scripts/codex-revision-etapa.mjs` | La define Claude Code al ejecutar hooks; si falta, se usa el directorio actual |
| `QVAC_ENDPOINT` | no | `functions/api/traducir.ts` | Endpoint compatible con OpenAI del motor QVAC (por defecto `http://127.0.0.1:11434/v1/chat/completions`) |
| `QVAC_TOKEN` | no | `functions/api/traducir.ts` | Bearer token opcional para autenticar contra QVAC |
| `QVAC_MODEL` | no | `functions/api/traducir.ts` | Modelo de lenguaje en QVAC (por defecto `qwen-2.5-7b-instruct`) |

Las `QVAC_*` se configuran en Cloudflare (proyecto → Settings → Variables and Secrets) y, en local con `wrangler pages dev`, en `.dev.vars` (no se versiona). Plantilla en `.env.example`.

## Reglas por área

Lee el archivo antes de editar esa zona:

| Archivo | Aplica a |
|---|---|
| `.claude/rules/datos.md` | `src/data/**`, `fuentes/**`, `scripts/**`, `src/lib/esquemas.ts`, `src/lib/integridad.ts` |
| `.claude/rules/ui.md` | `src/pages/**`, `src/components/**`, `src/layouts/**`, `src/styles/**` |

Orden de construcción: `blueprints/reconversion-laboral/tasks.json` y `blueprints/reconversion-laboral/epics/`.

## Cómo se construye

- **La sesión principal coordina; no escribe el código.** Por cada tarea invoca al subagente `constructor` (herramienta Agent, `subagent_type: "constructor"`, definido en `.claude/agents/constructor.md`, modelo `claude-sonnet-5-5` con esfuerzo alto), lee su informe y pasa a la siguiente. Una tarea por invocación, en el orden de `tasks.json`.
- **Estado en `tasks.json`:** el constructor pone `in_progress` al empezar y `done` cuando todo el `verify` sale 0, justo antes del Checkpoint, así el commit lo incluye. Es el único cambio permitido dentro de `blueprints/`. Al reanudar: una tarea en `in_progress` se resuelve primero (se corre su `verify`), y una tarea `done` cuya etiqueta `paso-NN` no existe (`git tag -l paso-NN` no la lista) recibe su Checkpoint antes de elegir otra.
- **Si el constructor informa un fallo** (ya hizo `git reset --hard inicio-paso-NN`), la sesión principal decide: reintentar con una indicación concreta sacada del blueprint, o detenerse y avisar a una persona. Nunca salta la tarea.
- **Excepción del paso 5 (`E2-T3`, mapeo de competencias):** lo escribe el constructor, pero antes de empezar el paso 6 la sesión principal revisa la evidencia de `src/data/mapeo.json` contra `fuentes/texto/` (que cada id citado diga lo que la competencia afirma) y corrige o pide corregir lo dudoso.
- Una persona también puede avanzar con `/the-architect:architect-next`. El constructor no tiene comando de barra.

## Revisión automática con Codex

- **Qué la dispara:** el hook `PostToolUse` de `.claude/settings.json` ejecuta `node scripts/codex-revision-etapa.mjs` después de cada comando Bash. Solo actúa cuando el comando crea la etiqueta `paso-NN` de la **última tarea pendiente de una etapa** (epic), es decir, cuando todas las tareas de esa épica ya tienen su etiqueta. Entonces pide a Codex (plugin `codex@openai-codex`) que revise el código de la etapa, desde la etiqueta `codex-etapa-*` anterior (o el commit raíz) hasta `HEAD`.
- **Dónde queda:** `docs/revisiones-codex/etapa-<epic>.md` (lo incluye el commit del paso siguiente; el de la última épica se versiona con el ítem de §20.1). Si la revisión salió bien, se crea la etiqueta `codex-etapa-<epic>`.
- **Obligación:** antes de empezar la siguiente etapa, lee el informe y corrige los hallazgos de severidad alta o media; cada corrección va en un commit `codex: correcciones etapa <epic>`, con las puertas en verde (`npm run check`, `npm test` a partir del paso 3 y los E2E afectados). Los hallazgos bajos se anotan, no bloquean. Si un hallazgo contradice el blueprint, gana el blueprint: anótalo en el informe de tu respuesta, no lo "corrijas".
- **No edites** los archivos de `docs/revisiones-codex/` ni crees ni borres etiquetas `codex-etapa-*` a mano.
- **Nunca bloquea:** si Codex no está instalado, no hay sesión iniciada, se agotó la cuota o pasaron 14 minutos, el informe registra el fallo y la construcción sigue; una persona puede correr `/codex:review` más tarde.
- Cada revisión consume la cuota de ChatGPT del usuario. `/codex:review` y `/codex:adversarial-review` siguen disponibles para una persona.

## No negociable

1. **Nunca inventes datos del CNPO.** Cada competencia mapeada cita ids de elemento que existen en el texto extraído del PDF; cada curso apunta solo a `https://capacitacionlaboral.trabajo.gob.pe/`.
2. **Nunca guardes datos del usuario:** sin `localStorage`/`sessionStorage`, sin base de datos, sin analítica. El único `fetch` permitido es hacia `/api/traducir` para analizar el relato con QVAC en memoria, sin persistencia.
3. **El aviso "Prototipo para el Innovathon Ulima x Tether. No es un sitio oficial del Estado peruano." aparece en todas las páginas** y no se usa ningún logo oficial.
4. **No edites los archivos que trajo `workspace/`** (`package.json`, `tsconfig.json`, `biome.json`, `astro.config.mjs`, `vitest.config.ts`, `playwright.config.ts`, `.gitignore`, `.nvmrc`, `scripts/codex-revision-etapa.mjs`, `.claude/**`, este archivo). Si parecen estar mal, detente y repórtalo.
5. **Nunca ejecutes `npm run deploy`, `npx wrangler login` ni `git push`.** Publicar es un paso humano.
6. **Nunca edites un comando `verify` ni marques una tarea como hecha con una puerta en rojo.**
7. Nunca subas `node_modules/`, `dist/`, `.astro/` ni archivos `.env`.
