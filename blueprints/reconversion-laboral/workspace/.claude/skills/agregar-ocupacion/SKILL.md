---
name: agregar-ocupacion
description: Agrega una nueva ocupación del CNPO de punta a punta (PDF, texto extraído, ocupaciones.json, mapeo con evidencia, pruebas y páginas). Úsala cuando alguien diga "agrega la ocupación X", "suma otro perfil del CNPO" o entregue un PDF nuevo de perfil ocupacional.
---

# Agregar una ocupación del CNPO

## Cuándo usarla
- Llega un PDF nuevo del Catálogo Nacional de Perfiles Ocupacionales con texto seleccionable.
- No sirve para PDF escaneados (como Compras `H2452004`): si `npm run extraer` produce menos de 5000 caracteres, detente y repórtalo.

## Pasos
1. Copia el PDF a la carpeta de origen (`PERFILES_ORIGEN` o `C:/Users/Home/Pictures/TETHER/innova/perfiles - copia`) con el nombre `<base>_<CODIGO>.pdf`.
2. Agrega `<base>_<CODIGO>.pdf` a `ARCHIVOS` en `scripts/copiar-perfiles.mjs` y el par `["<base>_<CODIGO>", "<CODIGO>"]` a `PERFILES` en `tests/extraccion.test.ts`.
3. `npm run copiar-perfiles && npm run extraer` y lee `fuentes/texto/<base>_<CODIGO>.txt`.
4. Agrega el id nuevo a `ID_OCUPACIONES` en `src/lib/esquemas.ts` y sube el `.length(9)` de `esquemaOcupaciones` al nuevo total.
5. Agrega la ocupación a `src/data/ocupaciones.json`: `codigo`, `nombre`, `nombreCorto`, `puestos`, `proposito`, `norma`, `pdf`, cada estándar con `rol` (`supervisor` si su descripción empieza con Supervisar, Organizar, Coordinar, Planificar o Gestionar) y sus elementos `<codigoEstandar>-E<n>`, y `demanda` con `tipo: "referencial"`.
6. Agrega su entrada a `src/data/mapeo.json`: entre 6 y 16 competencias, al menos 4 técnicas, cada una con los ids de elemento operativo que la sustentan.
7. Actualiza los conteos derivados en las pruebas: ocupaciones (9 → n), pares de transición (72 → n × (n − 1)), destinos por ranking (8 → n − 1), páginas `dist/transicion` (72 → n × (n − 1)).
8. Usa la skill `verificar-todo`.

## Verify
```bash
npx vitest run tests/extraccion.test.ts tests/ocupaciones.test.ts tests/integridad.test.ts tests/afinidad.test.ts   # expect: exit 0
npm run check      # expect: exit 0
npm run test:e2e   # expect: exit 0
```

## No hagas
- No inventes ids de elemento ni copies texto que no esté en `fuentes/texto/`.
- No mapees estándares `supervisor`: solo los `operativo` alimentan el cálculo.
- No uses la demanda para ordenar el ranking.
