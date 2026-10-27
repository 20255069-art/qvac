---
name: verificar-todo
description: Ejecuta todas las puertas del proyecto (formato, tipos, lint, pruebas unitarias, E2E con axe y build estático) y dice cuál falla. Úsala antes de marcar un paso como hecho, antes del Demo Day o cuando alguien diga "verifica todo", "corre las pruebas", "¿está listo?" o "revisa que nada se rompió".
---

# Verificar todo

## Cuándo usarla
- Al terminar cualquier paso de `blueprints/reconversion-laboral/tasks.json`, después de sus propios `verify`.
- Antes de pedirle a una persona que publique con `npm run deploy`.
- Después de cambiar cualquier archivo de `src/data/`.

## Pasos
1. Si `node -v` falla en Git Bash: `export PATH="/c/Program Files/nodejs:$PATH"`.
2. `npm run format` — aplica el formato de Biome (no cambia lógica).
3. `npm run check` — `astro check` (tipos) y `biome check .` (lint y formato).
4. `npm test` — Vitest sobre `tests/**/*.test.ts`, solo a partir del paso 3 (antes no hay pruebas y termina con 1 a propósito).
5. `npm run test:e2e` — Playwright construye, sirve en `http://127.0.0.1:4321` y corre `e2e/` en los proyectos `chromium` y `movil`.
6. `npm run build` y `test -f dist/index.html`.
7. Reporta cada comando con su código de salida; si alguno falla, copia las últimas 20 líneas del error.

## Verify
```bash
npm run check        # expect: exit 0
npm test             # expect: exit 0, 0 fallidas — solo a partir del paso 3
npm run test:e2e     # expect: exit 0, 0 fallidas
npm run build        # expect: exit 0
test -f dist/index.html   # expect: exit 0
```

## No hagas
- No edites un `verify` ni un test para que pase: arregla el código o los datos.
- No ejecutes `npm run deploy` ni `npx wrangler login`: publicar es humano.
- No ignores un error de axe "serious" o "critical": se corrige en la página.
