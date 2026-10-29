# Reconversión Laboral — instrucciones para agentes

Sitio estático (Astro + islas React, con una función de Cloudflare Pages en `functions/api/traducir.ts`) que orienta a un trabajador sobre ocupaciones afines según el CNPO del MTPE. Prototipo para el Innovathon Ulima x Tether; sin login, sin base de datos y con análisis de relatos mediante el motor de IA local-first QVAC (`/api/traducir`) y fallback determinista por palabras clave.

## Comandos

Desde la raíz del proyecto, en Git Bash. Si `node` no existe en el PATH: `export PATH="/c/Program Files/nodejs:$PATH"`.

| Tarea | Comando |
|---|---|
| Instalar | `npm install` · limpia: `npm ci` |
| Navegador E2E | `npx playwright install chromium` |
| Desarrollo | `npm run dev` |
| Construir | `npm run build` |
| Tipos + lint | `npm run check` |
| Formatear | `npm run format` |
| Unitarias | `npm test` · `npx vitest run tests/<archivo>.test.ts` |
| E2E | `npm run test:e2e` · `npx playwright test e2e/<archivo>.spec.ts` |
| Datos CNPO | `npm run copiar-perfiles` · `npm run extraer` |
| Publicar (solo humano) | `npm run deploy` |

Puerta: `npm run format && npm run check` en verde, y `npm test` a partir del paso 3, antes de dar una tarea por hecha. Orden de trabajo (secuencial, una tarea a la vez): `blueprints/reconversion-laboral/tasks.json`. Al empezar cada paso: `git tag -f inicio-paso-NN`; si sale mal: `git reset --hard inicio-paso-NN`.

## Quién construye

En Claude Code, la sesión principal coordina y delega cada tarea al subagente `constructor` (`.claude/agents/constructor.md`, `claude-sonnet-5-5`, esfuerzo alto): una tarea por invocación, estado `in_progress` → `done` en `tasks.json` antes del Checkpoint. Antes del paso 6, la sesión principal revisa la evidencia de `src/data/mapeo.json` (paso 5). Otros agentes siguen las mismas reglas de `.claude/agents/constructor.md`.

## Revisión con Codex al cerrar cada etapa

En Claude Code, un hook (`node scripts/codex-revision-etapa.mjs`) pide a Codex una revisión cuando se etiqueta la última tarea de una épica y deja el informe en `docs/revisiones-codex/etapa-<epic>.md`. Antes de la siguiente etapa, corrige los hallazgos altos y medios en un commit `codex: correcciones etapa <epic>`. No edites esos informes. Si el hook falla, la construcción sigue; una persona corre `/codex:review` a mano. Otros agentes sin hooks: al cerrar una épica, pide a una persona que corra `/codex:review`.

## No negociable

1. Nunca inventes datos del CNPO: toda competencia mapeada cita ids de elemento reales; todo curso apunta solo a `https://capacitacionlaboral.trabajo.gob.pe/`.
2. Nunca guardes datos del usuario (sin `localStorage`, sin base de datos, sin analítica). El único `fetch` permitido es hacia el endpoint propio `/api/traducir`, que consulta al motor IA local-first QVAC con fallback determinista local y sin almacenar los relatos.
3. El aviso "Prototipo para el Innovathon Ulima x Tether. No es un sitio oficial del Estado peruano." aparece en todas las páginas; sin logos oficiales.
4. No edites los archivos copiados de `workspace/` (configs, `package.json`, `scripts/codex-revision-etapa.mjs`, `.claude/**`, `CLAUDE.md`, este archivo).
5. Nunca ejecutes `npm run deploy`, `npx wrangler login` ni `git push`.
6. Nunca edites un comando `verify` ni marques una tarea como hecha con una puerta en rojo.

Arquitectura completa, límites entre capas y tokens de diseño: `CLAUDE.md` en este mismo directorio.
