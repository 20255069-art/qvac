# Reconversión Laboral — prototipo — Blueprint

> Generado por The Architect el 2026-10-24
> Forma: marketing-site, variante directorio (un dataset → páginas generadas) · `knowledge/shapes/marketing-site.md`
> Pista de ejecución: TypeScript / Node, framework estático Astro con islas React · `knowledge/runtime-tracks/ts-node.md`
> Modo de emisión: bundle (15 pasos)
> Versión del blueprint: 1
> Versiones verificadas por última vez: 2026-10-24 — procedencia por paquete en §11

**Cómo se usa este bundle.** Este archivo explica el *porqué*. `tasks.json` decide *qué sigue* (es el grafo de tareas que lee `/architect-next`) y `epics/*.md` explican *cómo* hacer cada tarea, cada épica autosuficiente. `workspace/` se copia entero a la raíz del proyecto en el Bootstrap de §10: así quedan en su lugar `CLAUDE.md`, `AGENTS.md`, `.claude/` y todos los archivos de configuración que necesitan las puertas de §9. Todo comando de este documento se ejecuta **desde la raíz del proyecto** (`C:/Users/Home/Pictures/TETHER/reconversion-laboral`), en Git Bash.

---

## 1. Project Overview & Non-Goals

### Vision

Un trabajador peruano que hoy es, por ejemplo, cajera en una tienda, entra desde su celular, toca su ocupación y ve en segundos a qué ocupaciones afines puede pasar (cajera de entidad financiera, operaria de almacén, teleoperadora…), qué competencias **ya tiene** (en verde, con la etiqueta "Ya lo tienes") y cuáles **le falta fortalecer** (en naranja, "Por fortalecer"). Cada competencia lleva su sustento: los códigos de los elementos de competencia del Catálogo Nacional de Perfiles Ocupacionales (CNPO) del Ministerio de Trabajo y Promoción del Empleo (MTPE) que la piden, y un enlace al portal gratuito Capacíta-T del MTPE con el tema exacto que debe buscar. Si no sabe cómo se llama su ocupación, puede contar con sus palabras un día de trabajo y el prototipo reconoce competencias por palabras clave.

Es el prototipo funcional que el equipo presenta al jurado del Demo Day del Innovathon Ulima x Tether (viernes 30 de octubre de 2026), dentro del reto del MTPE sobre reconversión laboral. Es un sitio 100 % estático con estilo institucional sobrio inspirado en gob.pe, **sin logos ni escudos oficiales** y con un aviso fijo de que no es un sitio del Estado. La IA es declarativa: la interfaz dice que la orientación es preliminar y que **no evalúa ni certifica**. No hay servidor, cuentas ni base de datos, y no se guarda nada de lo que la persona escribe.

### Users

| Persona | Qué viene a hacer | Frecuencia |
|---|---|---|
| Jurado del Demo Day (Ulima, Tether, MTPE) | Recorrer el flujo completo en su celular o en la proyección y juzgar si la orientación tiene sustento verificable | Una vez, el 30-oct-2026 |
| Trabajador(a) de baja calificación con celular (cajera, mozo, operario de limpieza…) | Elegir su ocupación o contar su experiencia y ver trabajos afines, qué ya sabe y dónde capacitarse gratis | Una o pocas veces |
| Equipo del proyecto | Mostrar el prototipo, ajustar datos del CNPO y volver a publicar | Diario hasta el Demo Day |

### Goals — v1 scope

1. Muestra, para cada una de 9 ocupaciones operativas del CNPO, el ranking de las 8 ocupaciones afines ordenado por afinidad, con el porcentaje de lo que ya tiene.
2. Muestra, para cada uno de los 72 pares origen → destino, las competencias que ya tiene y las que debe fortalecer, cada una con sus ids de elemento del CNPO como evidencia y, si falta, el tema a buscar en Capacíta-T con sus horas referenciales.
3. Reconoce competencias en un relato libre de la persona mediante el motor de IA local-first QVAC (a través del endpoint SSR `/api/traducir` con validación determinista sobre el catálogo CNPO) y fallback automático a palabras clave, sugiriendo hasta 3 ocupaciones parecidas sin guardar datos.
4. Funciona y se lee bien en un celular de 360 px de ancho, sin scroll horizontal y sin violaciones de accesibilidad serias o críticas (axe, WCAG 2 A/AA).
5. Se publica como sitio estático gratuito en Cloudflare Pages con un solo comando humano.

### Non-Goals — explicitly out of scope for v1

| No construimos | Por qué no ahora | Se revisa cuando |
|---|---|---|
| IA local QVAC de Tether (LLM real) para traducir relatos | No cabe en 4 días con calidad verificable; la costura `TraductorCompetencias` (§5) deja el reemplazo listo | Después del Demo Day, si el jurado o Tether piden el piloto con QVAC |
| Micro-dilemas o preguntas situacionales | Necesitan diseño pedagógico y validación que no hay en el plazo | Cuando el MTPE valide el mapeo de competencias |
| Ocupación Compras (H2452004) | Su PDF es un escaneo sin texto (~252 caracteres); requeriría OCR y revisión manual | Cuando exista una versión con texto o se apruebe un paso de OCR revisado |
| Login, cuentas o perfiles | El prototipo no necesita identidad y cada cuenta es datos personales que proteger | Si un piloto real necesita seguimiento de personas |
| Guardar o enviar datos del usuario (formularios, analítica, `localStorage`) | Promesa de privacidad del prototipo y cero superficie legal | Solo con base legal y consentimiento explícito en un piloto |
| Cifras reales de demanda (Encuesta de Demanda Ocupacional 2026) | Los datos aún no están disponibles al equipo; se muestra una demanda referencial ilustrativa | Cuando el MTPE publique la EDO 2026 |
| Filtro por región | Sin datos regionales confiables para las 9 ocupaciones | Junto con la EDO 2026 |
| WhatsApp o voz | Otro canal, otra infraestructura y otro costo | Si el piloto muestra que la web no llega a la población objetivo |
| Dominio propio | Costo y trámite; `*.pages.dev` basta para el Demo Day | Si el proyecto continúa después del Innovathon |
| Transiciones a puestos de supervisión | El reto es reconversión entre puestos operativos; los estándares `supervisor` no alimentan el cálculo | Cuando se diseñe una ruta de ascenso, no de reconversión |

**El constructor no debe implementar nada de esta tabla**, aunque parezca una adición pequeña mientras trabaja en un paso vecino. Si un paso parece requerir un no-objetivo, es un defecto del blueprint: detente y repórtalo en lugar de ampliar el alcance.

### Success metrics

| Métrica | Meta | Cómo se mide |
|---|---|---|
| Flujo completo navegable sin errores | 100 % de las rutas de `e2e/rutas.spec.ts` en verde el 29-oct-2026 | `npm run test:e2e` termina con 0 |
| Accesibilidad | 0 violaciones `critical`/`serious` de axe en las 5 páginas clave | `e2e/accesibilidad.spec.ts` |
| Usable en celular | `scrollWidth` ≤ 360 en las 5 páginas clave | `e2e/accesibilidad.spec.ts` |
| Sustento verificable | 100 % de las competencias mapeadas citan ids de elemento existentes | `tests/integridad.test.ts` |
| Publicado antes del Demo Day | URL `*.pages.dev` responde 200 el 29-oct-2026 | Lista de lanzamiento de §20.1 |

---

## 2. Tech Stack

**Pista de ejecución: TypeScript / Node.** Esta tabla nombra *decisiones*, no versiones. Cada versión fijada vive en §11 y en ningún otro lugar de la prosa.

Las versiones vienen de la verificación en vivo contra `registry.npmjs.org` hecha en esta sesión el 2026-10-24 (es la autoridad). `knowledge/runtime-tracks/ts-node.md` es el respaldo para lo que esa verificación no cubrió; en este proyecto no hizo falta usarlo para ninguna versión. Nunca se escribe una versión de memoria.

| Capa | Elección | Por qué esta, frente a qué |
|---|---|---|
| Lenguaje / runtime | TypeScript sobre Node 24 LTS (ya instalado en la máquina) | Un solo lenguaje para datos, motor, pruebas y páginas; Python no está instalado y no aporta nada a un sitio estático |
| Framework | Astro (`output: "static"` con adaptador Node SSR `@astrojs/node` en modo `standalone` para `/api/traducir`) | Prerenderiza todas las páginas estáticas e hidrata solo la isla de la entrevista; habilita únicamente el endpoint `/api/traducir` (`prerender = false`) para conectar con QVAC |
| Islas interactivas | React (solo `Entrevista.tsx`, `client:load`) | Una sola pantalla con estado; React es la integración oficial de Astro más documentada. Preact ahorraría KB pero añade un riesgo de compatibilidad sin beneficio visible en el Demo Day |
| Estilos | Tailwind CSS 4 con `@theme` en `src/styles/global.css` | Tokens en CSS, sin `tailwind.config.js`; frente a CSS a mano, impone la escala de 4 px y los tokens en cada clase |
| Componentes | Componentes `.astro` propios, sin librería | 9 componentes `.astro` y una isla React, todos simples; una librería como shadcn traería estilos ajenos al look institucional |
| Base de datos | NOT APPLICABLE — los datos son 5 archivos JSON versionados en `src/data/` y validados al construir | Un dataset de 9 ocupaciones cabe en el repositorio; una base de datos sería un servicio que mantener para nada |
| Acceso a datos / validación | zod 4 en `src/lib/esquemas.ts`, cargado una vez en `src/lib/datos.ts` | Esquemas como única fuente de tipos (`z.infer`); si un JSON es inválido, falla `npm run build` |
| Auth | NOT APPLICABLE — sin cuentas ni sesiones | Ningún dato del usuario se guarda |
| Trabajo en segundo plano | NOT APPLICABLE — todo se calcula al construir | No hay servidor |
| Pagos | NOT APPLICABLE | Producto gratuito |
| Almacenamiento de archivos | NOT APPLICABLE — los PDF del CNPO van en `fuentes/perfiles/` del repositorio | Son 9 archivos públicos del MTPE |
| Email / notificaciones | NOT APPLICABLE | No se contacta a nadie |
| Pruebas | Vitest (unitarias) + Playwright con axe (E2E y accesibilidad) | Vitest comparte el resolvedor de Vite con Astro; Playwright prueba el sitio construido de verdad |
| Lint + formato | Biome | Una herramienta y un archivo para TS, JSON y CSS; frente a ESLint + Prettier, la mitad de configuración |
| Hosting | Cloudflare Pages, plan Free, subida directa con wrangler | $0, uso comercial permitido, CDN global y archivo `_headers`; frente a Vercel Hobby, que prohíbe uso comercial |
| Gestor de paquetes | npm (viene con Node) | Desviación de la pista (pnpm): Node está en `C:/Program Files/nodejs` y `corepack enable` necesita permisos de administrador; el usuario no es programador. Ver §20.3 |

### Compatibility check

Revisado contra `knowledge/stack-compatibility.md`: la única combinación de riesgo es **Biome + Tailwind CSS 4** (Biome tiene su propio parser de CSS y rechaza `@theme` como sintaxis desconocida). Este blueprint la evita escribiendo `"css": { "parser": { "tailwindDirectives": true } }` en el `biome.json` que emite (§19.6) antes del primer `biome check`. Además: TypeScript se fija en la línea 6 porque `@astrojs/check` acepta `typescript ^5 || ^6` (la 7 rompería `astro check`); `vitest` 5 acepta el `vite ^8` que trae Astro 7. Los peers **opcionales** `@astrojs/markdown-remark` (Astro 7.1.1 lo pide exacto en `7.2.1`) y `oxc-transform-react` (`@astrojs/react` pide `^0.145.0` y `@vitejs/plugin-react` `^0.152.0`) **no se fijan**: fijarlos hizo fallar `npm install` con `ERESOLVE` en la prueba de humo del 2026-10-24, y sin ellos `npm install` termina con 0 y ninguno se instala (no usamos Markdown). Ver §11 y §20.3.

---

## 3. Directory Structure

```
reconversion-laboral/
  blueprints/reconversion-laboral/   # ESTE bundle (blueprint.md, tasks.json, epics/, workspace/). Se versiona; Biome, TypeScript, Vitest, Playwright y Tailwind lo excluyen (§19.6)
  .claude/                           # origen 2 (workspace/): settings.json, skills/, rules/
    settings.json                    # permisos: allow de cada comando de verificación, deny de deploy/login/push
    agents/constructor.md            # subagente que escribe el código de una tarea por invocación (claude-sonnet-5-5, esfuerzo alto)
    skills/agregar-ocupacion/SKILL.md
    skills/verificar-todo/SKILL.md
    rules/datos.md                   # se carga al tocar src/data/**, fuentes/**, scripts/**
    rules/ui.md                      # se carga al tocar src/pages/**, src/components/**, src/layouts/**, src/styles/**
  CLAUDE.md                          # origen 2 — instrucciones del agente constructor (§19.1)
  AGENTS.md                          # origen 2 — versión neutral para otros agentes (§19.2)
  package.json                       # origen 2 — manifiesto completo con versiones exactas (§19.6)
  package-lock.json                  # generado por `npm install` en el Bootstrap; se versiona
  .nvmrc                             # origen 2 — "24"
  .gitignore                         # origen 2 — llega antes del primer commit
  .gitattributes                     # origen 2 — fuerza LF (core.autocrlf=true en esta máquina) y marca PDF/PNG como binarios; llega antes del primer commit
  astro.config.mjs                   # origen 2 — salida estática, React, Tailwind (vite)
  tsconfig.json                      # origen 2 — extiende astro/tsconfigs/strict
  biome.json                         # origen 2 — formato, lint, exclusiones (incluye blueprints/)
  vitest.config.ts                   # origen 2 — solo tests/**/*.test.ts
  playwright.config.ts               # origen 2 — e2e/, webServer build+preview en 127.0.0.1:4321
  scripts/
    copiar-perfiles.mjs              # paso 3 — copia los 9 PDF del CNPO
    extraer-texto.mjs                # paso 3 — PDF → texto con pdfjs-dist
    verificar-enlaces.mjs            # paso 6 — revisa las URL de cursos (--solo-listar no usa red)
    codex-revision-etapa.mjs         # origen 2 (workspace/) — hook PostToolUse: revisión de Codex al cerrar cada épica (§19.6)
  fuentes/
    perfiles/*.pdf                   # paso 3 — los 9 PDF del CNPO (se versionan)
    texto/*.txt                      # paso 3 — su texto extraído (se versiona; base para redactar los JSON)
  src/
    data/
      ocupaciones.json               # paso 4 — 9 ocupaciones con estándares y elementos
      competencias.json              # paso 5 — 30 competencias (contenido literal en el paso 5)
      mapeo.json                     # paso 5 — ocupación → competencia → ids de elemento
      cursos.json                    # paso 6 — curso Capacíta-T por competencia
      contexto.json                  # paso 6 — dato de informalidad
    lib/
      esquemas.ts                    # paso 4 — esquemas zod y tipos
      integridad.ts                  # paso 5 — erroresDeIntegridad()
      pesos.ts                       # paso 7 — peso() y OcupacionMotor
      datos.ts                       # paso 7 — carga y valida los JSON (único que los importa en la app)
      afinidad.ts                    # paso 7 — crearMotor, calcularTransicion, ranking
      formato.ts                     # paso 8 — formatearPorcentaje()
      sugerencias.ts                 # paso 12 — sugerirOcupaciones()
      traductor/
        tipos.ts                     # paso 12 — contrato TraductorCompetencias
        palabras-clave.ts            # paso 12 — implementación determinista / fallback local
        qvac-protocolo.ts            # integración QVAC — prompt, cliente con reintentos y validación zod
        qvac.ts                      # integración QVAC — adaptador cliente hacia /api/traducir con fallback
    styles/global.css                # paso 1 — tokens @theme y estilos base
    layouts/Base.astro               # paso 2 — html, título, salto, barra, aviso, pie
    components/
      AvisoPrototipo.astro           # paso 2
      PiePagina.astro                # paso 2
      BotonEnlace.astro              # paso 8
      DatoInformalidad.astro         # paso 8
      TarjetaOcupacion.astro         # paso 9
      FilaDestino.astro              # paso 10
      InsigniaDemanda.astro          # paso 10
      ChipCompetencia.astro          # paso 11
      ItemPorFortalecer.astro        # paso 11
      islas/Entrevista.tsx           # paso 13 — única isla React
    pages/
      index.astro                    # paso 1, editada en 2 y 8 — portada
      ocupaciones/index.astro        # paso 9 — directorio
      ocupaciones/[id].astro         # paso 10 — 9 páginas de ranking
      transicion/[origen]/[destino].astro  # paso 11 — 72 páginas de transición
      entrevista.astro               # paso 13
      acerca.astro                   # paso 14 — metodología
      404.astro                      # paso 14
  public/_headers                    # paso 15 — cabeceras de seguridad para Cloudflare Pages
  docs/PUBLICAR.md                   # paso 15 — guía humana de publicación
  docs/revisiones-codex/etapa-<epic>.md  # los escribe el hook al cerrar cada épica (uno por épica); se versionan; nadie los edita
  docs/referencias/*.png             # OPCIONAL, lo agrega una persona: capturas de Stitch como referencia visual
  tests/
    extraccion.test.ts               # paso 3
    ocupaciones.test.ts              # paso 4
    integridad.test.ts               # paso 5
    complementarios.test.ts          # paso 6
    fixtures/datos-minimos.ts        # paso 7 — conjunto calculado a mano
    afinidad.test.ts                 # paso 7
    traductor.test.ts                # paso 12
  e2e/
    esqueleto.spec.ts                # paso 1
    layout.spec.ts                   # paso 2
    portada.spec.ts                  # paso 8
    ocupaciones.spec.ts              # paso 9
    ocupacion.spec.ts                # paso 10
    transicion.spec.ts               # paso 11
    entrevista.spec.ts               # paso 13
    rutas.spec.ts                    # paso 14
    accesibilidad.spec.ts            # paso 14
  dist/                              # generado por `npm run build` (outDir "./dist"); ignorado
  .astro/                            # generado por Astro; ignorado
  node_modules/                      # generado por npm; ignorado
```

**Reglas de frontera**
- `src/lib/datos.ts` es el **único** módulo de la aplicación que importa `src/data/*.json`. Las páginas `.astro` importan de `datos.ts` o `afinidad.ts`; los componentes reciben datos por props.
- La isla `src/components/islas/Entrevista.tsx` nunca importa `datos.ts`, `afinidad.ts` ni los JSON: recibe por props `{ id, nombreCorto }[]`, las competencias y el mapeo, y usa `pesos.ts`, `sugerencias.ts`, `traductor/` y `formato.ts`.
- `src/lib/**` no importa React, Astro ni `node:*`; es TypeScript puro y probable con Vitest.
- `scripts/*.mjs` solo importan `node:*` y `pdfjs-dist`; leen los JSON con `node:fs`, nunca importan de `src/`.
- `e2e/**` solo importan `@playwright/test` y `@axe-core/playwright`; nunca código de `src/`.
- **Convención de importación:** rutas relativas con extensión explícita (`../lib/afinidad.ts`). Se resuelve una sola vez, contra todos los cargadores, en la *matriz de convención de resolución* de §19.6; aquí solo se señala.

Cada archivo de este árbol tiene exactamente un origen: lo crea el paso indicado (en su lista **Do** y en `files` de su tarea en `tasks.json`), lo trae `workspace/` (origen 2, marcado arriba), o lo genera un comando nombrado (`npm install`, `npm run build`, Astro). Las rutas de salida (`dist/…`) salen de la tabla de *reconciliación de valores* de §19.6.

---

## 4. Data Model

No hay base de datos. El modelo son 5 archivos JSON versionados en `src/data/`, validados con zod (`src/lib/esquemas.ts`, contenido literal en el paso 4) al construir y en las pruebas. Las *transiciones* no se guardan: se calculan al construir.

### Entities

**Ocupacion** (`src/data/ocupaciones.json`, arreglo de 9) — un perfil ocupacional del CNPO; inmutable salvo corrección de datos.

| Campo | Tipo | Restricciones | Notas |
|---|---|---|---|
| `id` | enum | uno de `almacen`, `atencion_telefonica`, `caja_comercial`, `caja_financiera`, `housekeeping`, `lavanderia`, `limpieza`, `salon_comidas`, `trabajador_hogar`; único | Segmento de URL |
| `codigo` | string | `^[A-Z]\d{7}$` | Código del perfil en el CNPO (`H2452001`) |
| `nombre` | string | ≥ 3 | Nombre oficial del perfil, copiado del PDF |
| `nombreCorto` | string | ≥ 3 | Nombre del puesto en lenguaje común, fijado en la tabla del paso 4 |
| `puestos` | string[] | ≥ 1 | Otros nombres del puesto según el PDF |
| `proposito` | string | ≥ 20 | Propósito del perfil, copiado del PDF |
| `norma` | string | ≥ 5 | Norma de aprobación o refrendo |
| `pdf` | string | `^fuentes/perfiles/[a-z_]+_[A-Z]\d{7}\.pdf$` | Ruta del PDF fuente dentro del repositorio |
| `estandares` | Estandar[] | ≥ 1 | Ver abajo |
| `demanda` | `{ nivel, tipo }` | `nivel` ∈ `alta`/`media`/`baja`; `tipo` = `"referencial"` | Ilustrativa, decidida por el equipo; **no** interviene en el ranking |

**Estandar** (anidado en Ocupacion) — un estándar de competencia laboral del perfil.

| Campo | Tipo | Restricciones | Notas |
|---|---|---|---|
| `codigo` | string | `^[A-Z]\d{7}-\d+$` | Normalizado (`G2347002-1` aunque el PDF diga `G2347002 – 1`) |
| `rol` | enum | `operativo` / `supervisor` | `supervisor` si la descripción empieza con Supervisar, Organizar, Coordinar, Planificar o Gestionar, o nombra el puesto de supervisor |
| `descripcion` | string | ≥ 10 | Descripción del estándar |
| `elementos` | Elemento[] | ≥ 1 | |

**Elemento** (anidado en Estandar) — un elemento de competencia; es la unidad de evidencia.

| Campo | Tipo | Restricciones | Notas |
|---|---|---|---|
| `id` | string | `^[A-Z]\d{7}-\d+-E\d+$` | `<codigoEstandar>-E<n>`; `n` = número del elemento en el PDF, o su orden de aparición si el PDF no los numera |
| `texto` | string | ≥ 10 | Texto del elemento |

**Competencia** (`src/data/competencias.json`, arreglo de 30, contenido literal en el paso 5) — catálogo fijo del equipo.

| Campo | Tipo | Restricciones | Notas |
|---|---|---|---|
| `id` | string | `C01`…`C30`, único | `C01`–`C25` técnicas, `C26`–`C30` transversales |
| `nombre` | string | ≥ 3 | Nombre mostrado |
| `tipo` | enum | `tecnica` / `transversal` | Peso 1 / 0,5 en la fórmula |
| `descripcionSencilla` | string | ≥ 10 | Explicación en lenguaje llano |
| `palabrasClave` | string[] | ≥ 1, cada una `^[a-z]+( [a-z]+)*$` | Minúsculas, sin tildes ni eñes; las usa el traductor |

**Mapeo** (`src/data/mapeo.json`) — `{ [idOcupacion]: { [idCompetencia]: idElemento[] } }`: qué competencias pide cada ocupación y con qué elementos del CNPO se sustenta cada una. 6 a 16 competencias por ocupación, al menos 4 técnicas, cada id de elemento existente entre los estándares `operativo` de esa ocupación.

**Curso** (`src/data/cursos.json`, un objeto con 30 claves, contenido literal en el paso 6) — `{ [idCompetencia]: { tema, url, horasReferenciales } }`; `url` siempre `https://capacitacionlaboral.trabajo.gob.pe/`, `horasReferenciales` entero de 4 a 10.

**Contexto** (`src/data/contexto.json`, contenido literal en el paso 6) — `{ informalidadNacional: 69.8, periodo: "abril 2025 – marzo 2026", anterior: 70.7, fuente: "IEES (Sociedad Nacional de Industrias) con datos INEI-EPEN, Reporte Estadístico Laboral N° 02-2026" }`.

**Transicion** (calculada por `src/lib/afinidad.ts`, nunca guardada) — `{ origen, destino, afinidad, cobertura, jaccard, compartidas: [{ competencia, evidenciaOrigen[], evidenciaDestino[] }], porFortalecer: [{ competencia, evidenciaDestino[], curso }] }`.

### Relationships

- `Ocupacion —(1:N)→ Estandar —(1:N)→ Elemento` (anidados; se borran juntos).
- `Ocupacion —(N:M)→ Competencia` a través de `Mapeo`, con la lista de `Elemento.id` como atributo de la relación. Quitar una competencia del catálogo exige quitarla del mapeo y de `cursos.json`: `erroresDeIntegridad` y `datos.ts` lo detectan y hacen fallar el build.
- `Competencia —(1:1)→ Curso` por id.

### Indexes

| Tabla | Índice | Por qué |
|---|---|---|
| `ocupaciones.json` | `Map` por `id` en `crearMotor` | Búsqueda del `nombreCorto` al ordenar el ranking |
| `competencias.json` | `Map` por `id` en `crearMotor`, `erroresDeIntegridad` y `sugerirOcupaciones` | Peso y tipo de cada competencia en O(1) |

### Schema

```ts
// src/lib/esquemas.ts — contenido completo en el paso 4 de §9 (es el mismo archivo).
// Resumen de las formas que valida:
type Ocupacion = {
  id: "almacen" | "atencion_telefonica" | "caja_comercial" | "caja_financiera" | "housekeeping" | "lavanderia" | "limpieza" | "salon_comidas" | "trabajador_hogar";
  codigo: string; nombre: string; nombreCorto: string; puestos: string[]; proposito: string; norma: string; pdf: string;
  estandares: { codigo: string; rol: "operativo" | "supervisor"; descripcion: string; elementos: { id: string; texto: string }[] }[];
  demanda: { nivel: "alta" | "media" | "baja"; tipo: "referencial" };
};
type Competencia = { id: string; nombre: string; tipo: "tecnica" | "transversal"; descripcionSencilla: string; palabrasClave: string[] };
type Mapeo = Record<string, Record<string, string[]>>;
type Curso = { tema: string; url: "https://capacitacionlaboral.trabajo.gob.pe/"; horasReferenciales: number };
type Contexto = { informalidadNacional: number; periodo: string; anterior: number; fuente: string };
```

### Migrations

NOT APPLICABLE — no hay base de datos ni migraciones. Un cambio de forma se hace editando `src/lib/esquemas.ts` y los JSON en el mismo commit; `npm test` y `npm run build` fallan si no coinciden.

### Seed data

Los datos *son* la semilla: `src/data/*.json` se versionan y el sitio construido los incluye. Para regenerar el texto fuente: `npm run copiar-perfiles && npm run extraer`. No hay datos de demostración aparte.

---

## 5. API Design

El sitio combina generación estática para todas las páginas con un único endpoint SSR en Node (`POST /api/traducir`, `prerender = false`) que conecta con el motor de IA local-first QVAC y valida determinísticamente la respuesta contra el catálogo CNPO (`C01`–`C30`). Además, los contratos de módulos internos actúan como frontera entre capas.

### Conventions
- Base path: `/api/traducir` para traducción de relatos con QVAC (con fallback determinista en el cliente si devuelve error o no está disponible).
- Response envelope: `{ detectadas: [{ id, evidencias }], modo: "qvac" }` (200), `{ items: [], modo: "vacio" }` (200), o `{ error: "qvac_unavailable" }` (502). Los errores internos de dominio son `Error` con mensajes fijos en español (abajo).
- Error codes: mensajes fijos: `origen y destino deben ser distintos`, `ocupación desconocida: <id>`, `competencia desconocida: <id>`, `sin curso para <id>`, `Datos inconsistentes:\n<lista>`.
- Validation: zod en `src/lib/esquemas.ts` (aplicado en `src/lib/datos.ts` al construir) y en `src/lib/traductor/qvac-protocolo.ts` (para validar el body de `/api/traducir` y filtrar los IDs devueltos por QVAC).
- Pagination, idempotency, rate limits: reintentos automáticos (hasta 3 reintentos con espera de 1500 ms y timeout de 12 s por intento) ante HTTP 429 o fallos transitorios de red.

### Routes

| Method | Path | Description | Auth | Rate limit |
|---|---|---|---|---|
| GET (estático) | `/`, `/ocupaciones/`, `/ocupaciones/<id>/`, `/transicion/<origen>/<destino>/`, `/entrevista/`, `/acerca/` | Archivos HTML generados al construir (ver §6) | pública | la del CDN / servidor |
| POST (SSR) | `/api/traducir` | Clasifica los relatos del usuario con el motor QVAC sobre el catálogo `C01`–`C30` | pública | local-first |

### Critical endpoints — full detail

Los "endpoints" críticos son estas funciones; sus casos de error son los criterios de §9.

**`calcularTransicion(origen: string, destino: string): Transicion`** (`src/lib/afinidad.ts`)
- `peso(c)` = 1 si `tipo` es `tecnica`, 0,5 si es `transversal`.
- Con SA y SB = conjuntos de competencias de origen y destino en `mapeo.json`: `compartidas = SB ∩ SA`, `porFortalecer = SB \ SA` (ambas ordenadas por id); `cobertura = Σpeso(compartidas) / Σpeso(SB)`; `jaccard = Σpeso(SA ∩ SB) / Σpeso(SA ∪ SB)`; `afinidad = (cobertura + jaccard) / 2`, redondeada a 3 decimales con `Math.round(x * 1000) / 1000`.
- Errores: mismo id → `Error("origen y destino deben ser distintos")`; id sin entrada → `Error("ocupación desconocida: <id>")`; competencia sin curso → `Error("sin curso para <id>")`.
- Efectos: ninguno.

**`ranking(origen: string): Transicion[]`** — las otras 8 ocupaciones ordenadas por `afinidad` desc, luego `cobertura` desc, luego `nombreCorto` asc con `localeCompare(…, "es")`. **La demanda nunca interviene.** La interfaz muestra `Math.round(cobertura * 100)` como "Ya tienes el N % de lo que pide este trabajo" y respeta este orden.

**`TraductorCompetencias = (relatos: string[]) => Promise<CompetenciaDetectada[]>`** (`src/lib/traductor/tipos.ts`) — la costura para la IA. Hoy la implementa `crearTraductorPalabrasClave(competencias)`: normaliza (minúsculas + NFD + sin diacríticos), busca cada palabra clave como palabra o frase completa con `\b`, detecta la competencia con ≥ 1 coincidencia y devuelve `{ id, nombre, tipo, palabrasEncontradas }` ordenado por id; relato vacío → `[]`.

**Adaptador QVAC (`src/lib/traductor/qvac.ts` y `src/pages/api/traducir.ts`).** `crearTraductorQvac(competencias, opciones): TraductorCompetencias` implementa la misma firma: envía los relatos mediante `fetch('/api/traducir')` al endpoint SSR, el cual invoca a QVAC (`QVAC_ENDPOINT`, `QVAC_TOKEN`, `QVAC_MODEL`) con validación determinista sobre `C01`–`C30`. Si el endpoint falla, devuelve un estado distinto de 200 o retorna 0 competencias cuando el motor local sí detecta coincidencias, el adaptador activa automáticamente `crearTraductorPalabrasClave(competencias)` como fallback local.

**`sugerirOcupaciones(detectadas: string[], datos, maximo = 3): Sugerencia[]`** (`src/lib/sugerencias.ts`) — para cada ocupación, `cobertura = Σpeso(competencias de la ocupación detectadas) / Σpeso(competencias de la ocupación)`; devuelve las de cobertura > 0, desc, empate por `nombreCorto`, como máximo 3.

---

## 6. Frontend Architecture

### Routes

| Ruta | Página | Fuente de datos | Auth |
|---|---|---|---|
| `/` | Portada | `contexto` (estático, al construir) | pública |
| `/ocupaciones/` | Directorio de 9 ocupaciones | `ocupaciones` (estático) | pública |
| `/ocupaciones/[id]/` | Ranking de 8 destinos (9 páginas) | `ranking(id)` (estático, `getStaticPaths`) | pública |
| `/transicion/[origen]/[destino]/` | Detalle de transición (72 páginas) | `calcularTransicion` (estático, `getStaticPaths`) | pública |
| `/entrevista/` | Entrevista con isla React | props mínimas al construir; consulta a `/api/traducir` (QVAC) con fallback local en el navegador | pública |
| `/acerca/` | Metodología y fuentes | `ocupaciones`, `contexto` (estático) | pública |
| `404` | Página no encontrada | estática | pública |

### Rendering strategy

Todas las páginas HTML se prerenderizan al construir (`output: "static"`, `adapter: node({ mode: "standalone" })` y `build.format: "directory"` en `astro.config.mjs`), incluyendo las rutas dinámicas con `getStaticPaths()`. Únicamente el endpoint `src/pages/api/traducir.ts` declara `export const prerender = false` para ejecutarse bajo demanda en el servidor Node SSR. Ninguna página lleva `<script>` excepto `/entrevista/`, donde `<Entrevista client:load … />` hidrata la única isla.

### Component hierarchy

```
/transicion/[origen]/[destino]/ (estática)
  Base.astro
    AvisoPrototipo.astro
    main
      h1 · resumen
      h2 "Ya lo tienes" → li × compartidas → ChipCompetencia(ya-tienes)
      h2 "Por fortalecer" → ItemPorFortalecer × porFortalecer → ChipCompetencia(por-fortalecer)
      aviso de orientación preliminar
    PiePagina.astro

/ocupaciones/[id]/ (estática)
  Base.astro → main → h1 · ol → FilaDestino × 8 → InsigniaDemanda · nota de demanda

/entrevista/ (estática + 1 isla)
  Base.astro → main → h1 · <Entrevista client:load> (React, cliente)
```

### State management

Sin estado global ni librería de datos: las páginas estáticas no tienen estado. En la isla, `useState` guarda las tres respuestas, el error y los resultados; nada persiste (sin `localStorage`, sin `sessionStorage`, sin cookies, sin `fetch`). El traductor se crea una vez con `useMemo`.

### Loading, empty, and error states

| Superficie | Carga | Vacío | Error |
|---|---|---|---|
| Ranking de destinos | no aplica (HTML estático) | `Aún no hay trabajos afines para esta ocupación.` | datos inválidos → falla `npm run build` |
| Lista "Ya lo tienes" | no aplica | `Aún no encontramos competencias en común. Revisa la lista de abajo para empezar.` | — |
| Lista "Por fortalecer" | no aplica | `Ya tienes todas las competencias que pide este trabajo según el CNPO.` | — |
| Entrevista | instantánea (sin red) | `No encontramos competencias en lo que escribiste. Cuéntanos con más detalle qué haces en tu trabajo.` | `Escribe al menos 15 caracteres en alguna de las respuestas.` en `role="alert"` |
| Ruta inexistente | — | — | página 404 `No encontramos esta página` |

---

## 7. Design System

Sistema institucional sobrio, de referencia gubernamental, sin logos ni escudos. Todos los valores son literales; viven en `src/styles/global.css` (`@theme`, paso 1). Un solo tema claro (no hay modo oscuro en v1: el jurado verá la proyección y celulares en modo claro; la columna "Oscuro" lo indica).

### Colors

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--color-primario` | `#C1121F` | no aplica (sin tema oscuro en v1) | Barra superior, botón principal, cifra destacada |
| `--color-primario-oscuro` | `#8E0E18` | no aplica | Hover del botón principal |
| `--color-fondo` (texto sobre primario) | `#FFFFFF` | no aplica | Página; texto sobre la barra roja |
| `--color-superficie` | `#F4F6F8` | no aplica | Tarjetas del dato, pie, fondo de barras |
| `--color-borde` | `#D9DEE3` | no aplica | Bordes de 1px de tarjetas |
| `--color-texto` | `#1F2933` | no aplica | Texto principal |
| `--color-texto-suave` | `#52606D` | no aplica | Textos secundarios |
| `--color-enlace` / `--color-foco` | `#0B5CAD` | no aplica | Enlaces / contorno de foco de 3px |
| `--color-ya-tienes-texto` / `-fondo` | `#1E7B3A` / `#E6F4EA` | no aplica | Chip "Ya lo tienes", barra de cobertura |
| `--color-por-fortalecer-texto` / `-fondo` | `#B54708` / `#FEF0E1` | no aplica | Chip "Por fortalecer" |
| `--color-aviso-texto` / `-fondo` | `#5C4813` / `#FFF8DB` | no aplica | Aviso de prototipo, aviso de orientación preliminar |
| `--color-referencial-texto` / `-fondo` | `#3E4C59` / `#E4E7EB` | no aplica | Insignia "Demanda referencial" |
| Destructivo / éxito | se usan `por-fortalecer` y `ya-tienes` | no aplica | No hay acciones destructivas en v1 |

**Contraste (WCAG 2.2 AA), calculado para los pares de riesgo:** `#B54708` sobre `#FEF0E1` = **4,85:1**; `#1E7B3A` sobre `#E6F4EA` = **4,69:1**; `#FFFFFF` sobre `#C1121F` = **6,23:1**. Además: `#52606D` sobre `#FFFFFF` = 6,46:1, `#0B5CAD` sobre `#FFFFFF` = 6,67:1, `#5C4813` sobre `#FFF8DB` = 8,2:1, `#3E4C59` sobre `#E4E7EB` = 7,1:1, `#52606D` sobre `#F4F6F8` = 5,96:1. Todos ≥ 4,5:1.

### Typography

| Rol | Familia | Tamaño / interlineado | Peso | Tracking |
|---|---|---|---|---|
| Display (h1) | `system-ui, "Segoe UI", Roboto, Arial, sans-serif` | 2rem / 1.25 | 700 | normal |
| Heading (h2 / h3) | misma pila | 1.5rem / 1.3 · 1.25rem / 1.35 | 700 · 600 | normal |
| Body | misma pila | 18px (1.125rem) / 1.6 | 400 | normal |
| Mono | no se usa | — | — | — |

**Carga de fuentes:** ninguna. Pila del sistema; cero fuentes web y cero peticiones externas.

### Spacing, radius, elevation
- Espaciado: escala de 4px de Tailwind (`p-1` = 4px … `p-12` = 48px).
- Radio: 8px (`--radius-base`, clase `rounded-base`) en botones, tarjetas, chips e insignias.
- Sombras: ninguna; solo bordes de 1px `--color-borde`.
- Ancho máximo del contenido: 72rem (`--container-contenido`, clase `max-w-contenido`) · Breakpoints: los de Tailwind (`sm` 40rem, `md` 48rem, `lg` 64rem); se diseña primero a 360px.

### Motion

Sin animaciones ni transiciones en v1. Nada que reducir con `prefers-reduced-motion`.

### Component style

Institucional y sobrio: barra superior roja con el logotipo de texto "Reconversión Laboral", tarjetas blancas con borde de 1px, botones de al menos 48px de alto y ancho completo en el celular. Nada decorativo: la información (porcentaje, etiquetas, evidencia) es el diseño. Cada chip lleva texto, porque el color nunca es la única señal. Stitch (Google) es solo una referencia visual opcional (`docs/referencias/*.png`); estos tokens siempre ganan y nunca se pega código de Stitch.

---

## 8. Authentication & Authorization

NOT APPLICABLE — el prototipo no tiene cuentas, sesiones ni datos privados: todas las páginas son públicas y estáticas, y la entrevista no guarda ni envía nada. Las únicas credenciales del proyecto son la sesión de wrangler de la persona que publica, creada con `npx wrangler login` fuera del build (§12, §20.1).

---

## 9. BUILD ORDER

**Esta es la sección para la que existe todo el blueprint.** Un constructor que sigue §9 al pie de la letra y se detiene cuando cada puerta queda en verde entrega el proyecto.

### Las reglas de un paso

1. **Una sesión por paso.** Ningún paso toca más de 5 archivos ni tiene más de 6 criterios de aceptación; cada uno tiene entre 2 y 6, con al menos un caso de borde o de falla.
2. **Cada paso tiene sus cuatro campos, en este orden:** **Do** → **Done when** → **Verify** → **Checkpoint**. El Checkpoint es una línea de shell literal: `git add -A && git commit -m "paso NN: … (EX-TY)" && git tag paso-NN`. El tag `paso-NN` (número de paso con dos dígitos) marca el paso como verificado y es lo que cuenta §20.1. (Este proyecto usa `paso-NN` en lugar de `step-NN-slug`: decisión del usuario, ver §20.3.)
3. **"Done when" es observable y decidible por una máquina**, en forma EARS: **WHEN** `<disparador>` **THE SYSTEM SHALL** `<respuesta observable>`.
4. **"Se ve bien" está prohibido**, igual que *funciona*, *está implementado* o *renderiza correctamente*.
5. **`Verify` es shell literal**, copiable, con el resultado esperado en un comentario; el código de salida del propio comando impone ese resultado. Todo se ejecuta desde la raíz del proyecto en Git Bash.
6. **Un paso no está hecho hasta que pasan sus `Verify` y siguen pasando los de los pasos anteriores.** Las pruebas E2E de los pasos 1 y 2 solo afirman propiedades permanentes de la portada para que el paso 8 no las rompa; ningún paso agrega una regla de lint, de tipos o de datos que deje en rojo una puerta anterior.
7. **Punto de retorno al empezar cada paso.** La primera acción de cada paso es `git tag -f inicio-paso-NN` (NN = el paso que empieza). Si el paso sale mal: `git reset --hard inicio-paso-NN` y se reintenta; nunca se depura hacia adelante. No se usa `git reset --hard paso-<NN-1>`: borraría los commits `codex: correcciones etapa …` hechos después de esa etiqueta. Las etiquetas `inicio-paso-*` no cuentan en §20.1 (`git tag -l 'paso-*'` no las lista) y el hook de Codex las ignora. **La construcción es secuencial:** una tarea a la vez, en el orden de `tasks.json`. La sesión principal coordina y delega cada paso al subagente `constructor` (§19.4); el paso 5 lo revisa la sesión principal antes de empezar el paso 6.
8. **Nunca se salta un paso.** Si el paso 7 se bloquea, se detiene y se reporta.
9. **Ningún paso introduce un requisito que rompa en retroactivo la puerta de un paso anterior.** Este proyecto no tiene variables de entorno obligatorias (§10), así que la validación de entorno no existe; la validación de datos (`src/lib/datos.ts`) llega en el paso 7, cuando los cinco JSON ya existen, y ningún paso anterior construye páginas que la importen.
10. **Nunca se afirma un número derivado sin contarlo.** Los únicos conteos que verifican las puertas salen del propio dataset definido en este blueprint y no cambian si se edita la prosa: 9 ocupaciones (tabla del paso 4), 30 competencias (paso 5), 8 destinos por ocupación (9 − 1), 72 páginas de transición (9 × 8) y 9 líneas `omitido` (los 9 PDF de la lista del paso 3). Agregar una ocupación cambia todos a la vez; la skill `agregar-ocupacion` los enumera.
11. **Cada `Verify` termina con 0 cuando el paso está bien.** Las comprobaciones cuyo resultado correcto es un código distinto de 0 se envuelven: `status=0; cmd || status=$?; test "$status" -eq N`.
12. **Cada comprobación es posible en el medio donde corre.** Los tipos los comprueba `astro check`; el HTML generado, `test`/`grep` sobre `dist/`; el comportamiento en el navegador, Playwright; la lógica pura, Vitest. Ninguna comprobación en tiempo de ejecución mira tipos.
13. **El primer paso que produce algo ejecutable lo EJECUTA.** El paso 1 ya construye el sitio y Playwright lo sirve con `npm run preview` y lo visita: el contrato entre `package.json` (`preview` en `127.0.0.1:4321`) y `playwright.config.ts` (`baseURL` y `webServer.url`) se prueba en la primera puerta.
14. **Un `Verify` no depende de lo que produce su propio Checkpoint.** Ningún `Verify` consulta `git status`, `git ls-files`, `git diff --quiet` ni tags: cuando corre, los archivos del paso aún no están versionados. Las comprobaciones de archivos versionados viven en §20.1.
15. **Salida esperada escrita antes que su productor.** Las cifras del conjunto mínimo (paso 7) son aritmética de la fórmula de §5, no texto de un runtime; `69,8 %` sale de `toFixed(1)`. Ambas están en la tabla de *reconciliación byte a byte* de §19.6.
16. **Una puerta falla por la razón que dice.** Ninguna puerta acepta "cualquier código distinto de 0": se afirma el código exacto (`test "$status" -eq 1`) y se usa `grep -q`/`test -e` con un solo argumento, cuyo código 2 (error de uso o archivo inexistente) hace fallar la línea.

### Un paso, una unidad — la regla de conteo

> **Un paso de §9 = una tarea de `tasks.json` = un bloque de tarea en un archivo de épica.**

Este blueprint tiene **15 pasos**, 15 tareas en `tasks.json` y 15 bloques de tarea repartidos en **6 épicas**: `01-base` (pasos 1–2), `02-datos` (3–5), `03-motor` (6–7), `04-paginas` (8–11), `05-entrevista` (12–13) y `06-calidad-publicacion` (14–15). La plantilla recomienda épicas de 5 a 9 pasos (2 o 3 épicas para 15 pasos); este bundle usa 6 épicas pequeñas porque así lo pidió el equipo, para que cada épica coincida con una fase de trabajo del plazo de 4 días (desviación registrada en §20.3). No cambia el orden ni el tamaño de ningún paso.

### Mapa de pasos

| # | Paso | Tarea | Depende de | Toca (*Files touched*) | Puerta |
|---|---|---|---|---|---|
| 1 | Esqueleto Astro con tokens de diseño | `E1-T1` | — | `src/styles/global.css`, `src/pages/index.astro`, `e2e/esqueleto.spec.ts` | `npx playwright test e2e/esqueleto.spec.ts` |
| 2 | Layout base con aviso, encabezado y pie | `E1-T2` | 1 | `src/layouts/Base.astro`, `src/components/AvisoPrototipo.astro`, `src/components/PiePagina.astro`, `src/pages/index.astro`, `e2e/layout.spec.ts` | `npx playwright test e2e/esqueleto.spec.ts e2e/layout.spec.ts` |
| 3 | Copia de perfiles CNPO y extracción de texto | `E2-T1` | 1 | `scripts/copiar-perfiles.mjs`, `scripts/extraer-texto.mjs`, `fuentes/perfiles/*.pdf`, `fuentes/texto/*.txt`, `tests/extraccion.test.ts` | `npx vitest run tests/extraccion.test.ts` |
| 4 | Esquemas zod y ocupaciones.json | `E2-T2` | 3 | `src/lib/esquemas.ts`, `src/data/ocupaciones.json`, `tests/ocupaciones.test.ts` | `npx vitest run tests/ocupaciones.test.ts` |
| 5 | Catálogo de competencias y mapeo con evidencia | `E2-T3` | 4 | `src/data/competencias.json`, `src/data/mapeo.json`, `src/lib/integridad.ts`, `tests/integridad.test.ts` | `npx vitest run tests/integridad.test.ts` |
| 6 | Cursos Capacíta-T, contexto y revisión de enlaces | `E3-T1` | 5 | `src/data/cursos.json`, `src/data/contexto.json`, `scripts/verificar-enlaces.mjs`, `tests/complementarios.test.ts` | `npx vitest run tests/complementarios.test.ts` |
| 7 | Motor de afinidad con pruebas a mano y reales | `E3-T2` | 6 | `src/lib/pesos.ts`, `src/lib/datos.ts`, `src/lib/afinidad.ts`, `tests/fixtures/datos-minimos.ts`, `tests/afinidad.test.ts` | `npx vitest run tests/afinidad.test.ts` |
| 8 | Portada con dato de informalidad y llamados | `E4-T1` | 2, 7 | `src/pages/index.astro`, `src/components/DatoInformalidad.astro`, `src/components/BotonEnlace.astro`, `src/lib/formato.ts`, `e2e/portada.spec.ts` | `npx playwright test e2e/esqueleto.spec.ts e2e/layout.spec.ts e2e/portada.spec.ts` |
| 9 | Directorio de ocupaciones | `E4-T2` | 2, 7 | `src/pages/ocupaciones/index.astro`, `src/components/TarjetaOcupacion.astro`, `e2e/ocupaciones.spec.ts` | `npx playwright test e2e/ocupaciones.spec.ts` |
| 10 | Ranking de destinos por ocupación | `E4-T3` | 9 | `src/pages/ocupaciones/[id].astro`, `src/components/FilaDestino.astro`, `src/components/InsigniaDemanda.astro`, `e2e/ocupacion.spec.ts` | `npx playwright test e2e/ocupacion.spec.ts` |
| 11 | Páginas de transición con evidencia y cursos | `E4-T4` | 10 | `src/pages/transicion/[origen]/[destino].astro`, `src/components/ChipCompetencia.astro`, `src/components/ItemPorFortalecer.astro`, `e2e/transicion.spec.ts` | `npx playwright test e2e/transicion.spec.ts` |
| 12 | Traductor por palabras clave y sugerencias | `E5-T1` | 7 | `src/lib/traductor/tipos.ts`, `src/lib/traductor/palabras-clave.ts`, `src/lib/sugerencias.ts`, `tests/traductor.test.ts` | `npx vitest run tests/traductor.test.ts` |
| 13 | Isla de entrevista sin guardar datos | `E5-T2` | 8, 12 | `src/components/islas/Entrevista.tsx`, `src/pages/entrevista.astro`, `e2e/entrevista.spec.ts` | `npx playwright test e2e/entrevista.spec.ts` |
| 14 | Metodología, 404, accesibilidad y E2E completo | `E6-T1` | 8, 11, 13 | `src/pages/acerca.astro`, `src/pages/404.astro`, `e2e/rutas.spec.ts`, `e2e/accesibilidad.spec.ts` | `npx playwright test` |
| 15 | Preparación de la publicación en Cloudflare Pages | `E6-T2` | 14 | `public/_headers`, `docs/PUBLICAR.md` | `npx wrangler --version` |

---

#### Paso 1 — Esqueleto Astro con tokens de diseño

*Tarea `E1-T1` · épica `01-base` · depende de: nada (después del Bootstrap de §10)*

**Do**

Antes de empezar: `git tag -f inicio-paso-01` (punto de retorno de este paso).

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

Archivos que toca este paso (*Files touched*): `src/styles/global.css`, `src/pages/index.astro`, `e2e/esqueleto.spec.ts`.

**Done when**

- [ ] WHEN `npm run build` se ejecuta THE SYSTEM SHALL terminar con código 0 y generar `dist/index.html`.
- [ ] WHEN `npx playwright test e2e/esqueleto.spec.ts` construye y sirve el sitio en `http://127.0.0.1:4321` THE SYSTEM SHALL responder 200 en `/` y mostrar exactamente un `h1` visible, en los proyectos `chromium` y `movil`.
- [ ] WHEN `/` se carga THE SYSTEM SHALL aplicar al `body` los tokens de `src/styles/global.css`: fondo `rgb(255, 255, 255)`, color `rgb(31, 41, 51)` y tamaño de letra `18px`.
- [ ] WHEN `src/styles/global.css` se inspecciona THE SYSTEM SHALL contener las líneas `@import "tailwindcss";`, `@source not "../../blueprints";`, `@source not "../../fuentes";` y `--color-primario: #c1121f;`.
- [ ] WHEN `npm run check` se ejecuta THE SYSTEM SHALL terminar con código 0.

**Verify**

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

**Checkpoint**

```bash
git add -A && git commit -m "paso 01: Esqueleto Astro con tokens de diseño (E1-T1)" && git tag paso-01
# si este paso sale mal antes de completarse: git reset --hard inicio-paso-01 (conserva los commits "codex: correcciones etapa …" anteriores)
```

---

#### Paso 2 — Layout base con aviso, encabezado y pie

*Tarea `E1-T2` · épica `01-base` · depende de: paso 1*

**Do**

Antes de empezar: `git tag -f inicio-paso-02` (punto de retorno de este paso).

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

Archivos que toca este paso (*Files touched*): `src/layouts/Base.astro`, `src/components/AvisoPrototipo.astro`, `src/components/PiePagina.astro`, `src/pages/index.astro` (edición), `e2e/layout.spec.ts`.

**Done when**

- [ ] WHEN `/` se carga THE SYSTEM SHALL mostrar en `[data-testid="aviso-prototipo"]` el texto `Prototipo para el Innovathon Ulima x Tether. No es un sitio oficial del Estado peruano.`
- [ ] WHEN `/` se carga THE SYSTEM SHALL tener `<html lang="es">` y el título `Inicio | Reconversión Laboral`.
- [ ] WHEN se presiona Tab una vez en `/` THE SYSTEM SHALL enfocar el enlace `Saltar al contenido` con `href="#contenido"`, y la página SHALL tener exactamente un `main#contenido`.
- [ ] WHEN `/` se carga THE SYSTEM SHALL mostrar en el `footer` el texto `Catálogo Nacional de Perfiles Ocupacionales (CNPO)` y no contener ningún elemento `img`.
- [ ] WHEN `npx playwright test e2e/esqueleto.spec.ts e2e/layout.spec.ts` y `npm run check` se ejecutan THE SYSTEM SHALL terminar ambos con código 0.

**Verify**

```bash
npm run check   # expect: exit 0 — astro check sin errores y biome check sin diagnósticos de error
npx playwright test e2e/esqueleto.spec.ts e2e/layout.spec.ts   # expect: exit 0, 0 fallidas — el esqueleto del paso 1 sigue pasando
```

**Checkpoint**

```bash
git add -A && git commit -m "paso 02: Layout base con aviso, encabezado y pie (E1-T2)" && git tag paso-02
# si este paso sale mal antes de completarse: git reset --hard inicio-paso-02 (conserva los commits "codex: correcciones etapa …" anteriores)
```

---

#### Paso 3 — Copia de perfiles CNPO y extracción de texto

*Tarea `E2-T1` · épica `02-datos` · depende de: paso 1*

**Do**

Antes de empezar: `git tag -f inicio-paso-03` (punto de retorno de este paso).

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

Archivos que toca este paso (*Files touched*): `scripts/copiar-perfiles.mjs`, `scripts/extraer-texto.mjs`, `fuentes/perfiles/*.pdf`, `fuentes/texto/*.txt`, `tests/extraccion.test.ts`.

**Done when**

- [ ] WHEN `npm run copiar-perfiles` se ejecuta en esta máquina THE SYSTEM SHALL dejar en `fuentes/perfiles/` exactamente los 9 PDF de la lista, sin `compras_H2452004.pdf`, y terminar con código 0.
- [ ] WHEN `node scripts/copiar-perfiles.mjs` se ejecuta por segunda vez THE SYSTEM SHALL imprimir 9 líneas que empiezan con `omitido ` y terminar con código 0 sin sobrescribir ningún archivo.
- [ ] WHEN `npm run extraer` se ejecuta THE SYSTEM SHALL escribir un `fuentes/texto/<nombre>.txt` por cada PDF y terminar con código 0.
- [ ] WHEN `npx vitest run tests/extraccion.test.ts` se ejecuta THE SYSTEM SHALL comprobar que cada uno de los 9 `.txt` tiene más de 5000 caracteres, contiene su código de perfil y la marca `===== fin pag 1`, y terminar con código 0.
- [ ] WHEN se busca `fuentes/perfiles/compras_H2452004.pdf` THE SYSTEM SHALL no encontrarlo.

**Verify**

```bash
npm run copiar-perfiles   # expect: exit 0 — copia los 9 PDF (u omite los que ya están)
test "$(node scripts/copiar-perfiles.mjs | grep -c '^omitido ')" -eq 9   # expect: exit 0 — segunda corrida: los 9 omitidos, nada sobrescrito
npm run extraer   # expect: exit 0 — imprime 9 líneas «fuentes/texto/…: N caracteres»
npx vitest run tests/extraccion.test.ts   # expect: exit 0, 0 fallidas, 0 omitidas
status=0; test -e fuentes/perfiles/compras_H2452004.pdf || status=$?; test "$status" -eq 1   # expect: exit 0 — 1 = el PDF escaneado de Compras no está; 0 (existe) hace fallar la línea
npm run check   # expect: exit 0 — astro check sin errores y biome check sin diagnósticos de error
```

**Checkpoint**

```bash
git add -A && git commit -m "paso 03: Copia de perfiles CNPO y extracción de texto (E2-T1)" && git tag paso-03
# si este paso sale mal antes de completarse: git reset --hard inicio-paso-03 (conserva los commits "codex: correcciones etapa …" anteriores)
```

---

#### Paso 4 — Esquemas zod y ocupaciones.json

*Tarea `E2-T2` · épica `02-datos` · depende de: paso 3*

**Do**

Antes de empezar: `git tag -f inicio-paso-04` (punto de retorno de este paso).

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

Archivos que toca este paso (*Files touched*): `src/lib/esquemas.ts`, `src/data/ocupaciones.json`, `tests/ocupaciones.test.ts`.

**Done when**

- [ ] WHEN `npx vitest run tests/ocupaciones.test.ts` valida `src/data/ocupaciones.json` con `esquemaOcupaciones` THE SYSTEM SHALL aceptarlo, con los ids `almacen`, `atencion_telefonica`, `caja_comercial`, `caja_financiera`, `housekeeping`, `lavanderia`, `limpieza`, `salon_comidas` y `trabajador_hogar` en ese orden, cada uno con el `codigo`, el `nombreCorto`, el `pdf` y el `demanda.nivel` de la tabla de ocupaciones y `demanda.tipo` igual a `referencial`.
- [ ] WHEN el test recorre los estándares de cada ocupación THE SYSTEM SHALL comprobar que cada `codigo` de estándar empieza con `<codigo de la ocupación>-`, que cada elemento tiene id `<codigoEstandar>-E<n>`, que hay al menos un estándar `operativo` con al menos un elemento y que todo estándar cuya descripción empieza con Supervisar, Organizar, Coordinar, Planificar o Gestionar tiene `rol` igual a `supervisor`.
- [ ] WHEN el test busca cada código de estándar en `fuentes/texto/<base>.txt` con la expresión `<codigo>\s*[-–]\s*<n>` THE SYSTEM SHALL encontrarlo en el texto extraído del PDF de su ocupación.
- [ ] WHEN `esquemaOcupacion.safeParse` recibe una ocupación con un estándar de `rol` igual a `jefe` THE SYSTEM SHALL devolver `success: false`.
- [ ] WHEN `npm run check` se ejecuta THE SYSTEM SHALL terminar con código 0.

**Verify**

```bash
npx vitest run tests/ocupaciones.test.ts   # expect: exit 0, 0 fallidas, 0 omitidas
npm run check   # expect: exit 0 — astro check sin errores y biome check sin diagnósticos de error
```

**Checkpoint**

```bash
git add -A && git commit -m "paso 04: Esquemas zod y ocupaciones.json (E2-T2)" && git tag paso-04
# si este paso sale mal antes de completarse: git reset --hard inicio-paso-04 (conserva los commits "codex: correcciones etapa …" anteriores)
```

---

#### Paso 5 — Catálogo de competencias y mapeo con evidencia

*Tarea `E2-T3` · épica `02-datos` · depende de: paso 4*

**Do**

Antes de empezar: `git tag -f inicio-paso-05` (punto de retorno de este paso).

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

Archivos que toca este paso (*Files touched*): `src/data/competencias.json`, `src/data/mapeo.json`, `src/lib/integridad.ts`, `tests/integridad.test.ts`.

**Done when**

- [ ] WHEN `npx vitest run tests/integridad.test.ts` valida `src/data/competencias.json` THE SYSTEM SHALL encontrar las competencias `C01` a `C30` en orden, `C01`–`C25` con `tipo` igual a `tecnica`, `C26`–`C30` con `tipo` igual a `transversal`, y toda palabra clave en minúsculas sin tildes.
- [ ] WHEN `erroresDeIntegridad` revisa los datos reales THE SYSTEM SHALL devolver una lista vacía: todo id de elemento citado en `mapeo.json` existe entre los estándares `operativo` de esa ocupación y toda competencia citada existe en el catálogo.
- [ ] WHEN el test cuenta las competencias de cada una de las 9 ocupaciones en `mapeo.json` THE SYSTEM SHALL encontrar entre 6 y 16 por ocupación, con al menos 4 de `tipo` igual a `tecnica`.
- [ ] WHEN `erroresDeIntegridad` recibe una copia del mapeo con el id de elemento inexistente `H2452001-99-E99` THE SYSTEM SHALL devolver al menos un error que contiene `H2452001-99-E99`.
- [ ] WHEN el test calcula la afinidad con la fórmula de pesos (técnica 1, transversal 0,5; promedio de cobertura y Jaccard) sobre `mapeo.json` THE SYSTEM SHALL dar a `caja_comercial`→`caja_financiera` más afinidad que a `caja_comercial`→`lavanderia`, y a `limpieza`→`housekeeping` más que a `limpieza`→`atencion_telefonica`.
- [ ] WHEN `npm run check` se ejecuta THE SYSTEM SHALL terminar con código 0.

**Verify**

```bash
npx vitest run tests/integridad.test.ts   # expect: exit 0, 0 fallidas, 0 omitidas
npx vitest run tests/ocupaciones.test.ts   # expect: exit 0 — la puerta del paso 4 sigue en verde
npm run check   # expect: exit 0 — astro check sin errores y biome check sin diagnósticos de error
```

**Checkpoint**

```bash
git add -A && git commit -m "paso 05: Catálogo de competencias y mapeo con evidencia (E2-T3)" && git tag paso-05
# si este paso sale mal antes de completarse: git reset --hard inicio-paso-05 (conserva los commits "codex: correcciones etapa …" anteriores)
```

---

#### Paso 6 — Cursos Capacíta-T, contexto y revisión de enlaces

*Tarea `E3-T1` · épica `03-motor` · depende de: paso 5*

**Do**

Antes de empezar: `git tag -f inicio-paso-06` (punto de retorno de este paso).

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

Archivos que toca este paso (*Files touched*): `src/data/cursos.json`, `src/data/contexto.json`, `scripts/verificar-enlaces.mjs`, `tests/complementarios.test.ts`.

**Done when**

- [ ] WHEN `npx vitest run tests/complementarios.test.ts` valida `src/data/cursos.json` THE SYSTEM SHALL encontrar exactamente una entrada por cada id de `competencias.json`, todas con `url` igual a `https://capacitacionlaboral.trabajo.gob.pe/` y `horasReferenciales` entero entre 4 y 10.
- [ ] WHEN el test valida `src/data/contexto.json` con `esquemaContexto` THE SYSTEM SHALL aceptarlo con `informalidadNacional` 69.8, `anterior` 70.7 y `periodo` `abril 2025 – marzo 2026`.
- [ ] WHEN `esquemaCurso.safeParse` recibe `horasReferenciales: 12` o una `url` distinta del portal Capacíta-T THE SYSTEM SHALL devolver `success: false` en ambos casos.
- [ ] WHEN `node scripts/verificar-enlaces.mjs --solo-listar` se ejecuta THE SYSTEM SHALL imprimir solo la línea `https://capacitacionlaboral.trabajo.gob.pe/` y terminar con código 0 sin usar la red.
- [ ] WHEN `npm run check` se ejecuta THE SYSTEM SHALL terminar con código 0.

**Verify**

```bash
npx vitest run tests/complementarios.test.ts   # expect: exit 0, 0 fallidas, 0 omitidas
test "$(node scripts/verificar-enlaces.mjs --solo-listar)" = "https://capacitacionlaboral.trabajo.gob.pe/"   # expect: exit 0 — una sola URL única, sin red
npm run check   # expect: exit 0 — astro check sin errores y biome check sin diagnósticos de error
```

**Checkpoint**

```bash
git add -A && git commit -m "paso 06: Cursos Capacíta-T, contexto y revisión de enlaces (E3-T1)" && git tag paso-06
# si este paso sale mal antes de completarse: git reset --hard inicio-paso-06 (conserva los commits "codex: correcciones etapa …" anteriores)
```

---

#### Paso 7 — Motor de afinidad con pruebas a mano y reales

*Tarea `E3-T2` · épica `03-motor` · depende de: paso 6*

**Do**

Antes de empezar: `git tag -f inicio-paso-07` (punto de retorno de este paso).

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

Archivos que toca este paso (*Files touched*): `src/lib/pesos.ts`, `src/lib/datos.ts`, `src/lib/afinidad.ts`, `tests/fixtures/datos-minimos.ts`, `tests/afinidad.test.ts`.

**Done when**

- [ ] WHEN `npx vitest run tests/afinidad.test.ts` calcula `a`→`b` con `crearMotor(datosMinimos)` THE SYSTEM SHALL devolver `cobertura` 0.6, `jaccard` 0.428571 con 6 decimales, `afinidad` 0.514, compartidas `C02` y `C26`, y por fortalecer `C03` con el curso `Tema tres`.
- [ ] WHEN el test pide `ranking("a")` en el conjunto mínimo THE SYSTEM SHALL devolver los destinos `d`, `c`, `b` en ese orden, con el empate de afinidad 0.7 y cobertura 1 resuelto por `nombreCorto` (`Alfa` antes que `Beta`).
- [ ] WHEN el test recorre los 72 pares ordenados de las 9 ocupaciones reales THE SYSTEM SHALL cumplir en cada uno que los ids de compartidas y por fortalecer, unidos, son exactamente las competencias del destino en `mapeo.json`, que no se repiten entre ambas listas, y que `afinidad`, `cobertura` y `jaccard` están entre 0 y 1.
- [ ] WHEN el test pide `ranking` para cada una de las 9 ocupaciones reales THE SYSTEM SHALL devolver 8 destinos sin el origen, ordenados por afinidad no creciente.
- [ ] WHEN `calcularTransicion` recibe el mismo id como origen y destino, o el id desconocido `no_existe` THE SYSTEM SHALL lanzar un `Error` con el mensaje `origen y destino deben ser distintos` o `ocupación desconocida: no_existe`, respectivamente.
- [ ] WHEN `npm run check` y `npm test` se ejecutan THE SYSTEM SHALL terminar ambos con código 0.

**Verify**

```bash
npx vitest run tests/afinidad.test.ts   # expect: exit 0, 0 fallidas, 0 omitidas
npm test   # expect: exit 0 — todas las pruebas unitarias de los pasos 3 a 7
npm run check   # expect: exit 0 — astro check sin errores y biome check sin diagnósticos de error
```

**Checkpoint**

```bash
git add -A && git commit -m "paso 07: Motor de afinidad con pruebas a mano y reales (E3-T2)" && git tag paso-07
# si este paso sale mal antes de completarse: git reset --hard inicio-paso-07 (conserva los commits "codex: correcciones etapa …" anteriores)
```

---

#### Paso 8 — Portada con dato de informalidad y llamados

*Tarea `E4-T1` · épica `04-paginas` · depende de: paso 2, paso 7*

**Do**

Antes de empezar: `git tag -f inicio-paso-08` (punto de retorno de este paso).

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

Archivos que toca este paso (*Files touched*): `src/pages/index.astro` (edición), `src/components/DatoInformalidad.astro`, `src/components/BotonEnlace.astro`, `src/lib/formato.ts`, `e2e/portada.spec.ts`.

**Done when**

- [ ] WHEN `/` se carga THE SYSTEM SHALL mostrar el `h1` `Lo que ya sabes hacer vale en otros trabajos`.
- [ ] WHEN `/` se carga THE SYSTEM SHALL mostrar el dato `69,8 %` y el texto `Fuente: IEES (Sociedad Nacional de Industrias) con datos INEI-EPEN, Reporte Estadístico Laboral N° 02-2026`.
- [ ] WHEN `/` se carga THE SYSTEM SHALL mostrar el enlace `Elige tu ocupación` con `href="/ocupaciones/"` y el enlace `Cuéntanos tu experiencia` con `href="/entrevista/"`, cada uno de al menos 48 px de alto.
- [ ] WHEN `/` se carga THE SYSTEM SHALL mostrar dentro de `main` una lista ordenada con exactamente 3 pasos.
- [ ] WHEN `/` se abre con 360 px de ancho THE SYSTEM SHALL tener `document.documentElement.scrollWidth` menor o igual a 360.
- [ ] WHEN `npx playwright test e2e/esqueleto.spec.ts e2e/layout.spec.ts e2e/portada.spec.ts` y `npm run check` se ejecutan THE SYSTEM SHALL terminar ambos con código 0.

**Verify**

```bash
npm run check   # expect: exit 0 — astro check sin errores y biome check sin diagnósticos de error
npx playwright test e2e/esqueleto.spec.ts e2e/layout.spec.ts e2e/portada.spec.ts   # expect: exit 0, 0 fallidas — las puertas de los pasos 1 y 2 siguen en verde
```

**Checkpoint**

```bash
git add -A && git commit -m "paso 08: Portada con dato de informalidad y llamados (E4-T1)" && git tag paso-08
# si este paso sale mal antes de completarse: git reset --hard inicio-paso-08 (conserva los commits "codex: correcciones etapa …" anteriores)
```

---

#### Paso 9 — Directorio de ocupaciones

*Tarea `E4-T2` · épica `04-paginas` · depende de: paso 2, paso 7*

**Do**

Antes de empezar: `git tag -f inicio-paso-09` (punto de retorno de este paso).

Crear el directorio de las 9 ocupaciones, la puerta de entrada al recorrido. Página estática sin `<script>`.

`src/components/TarjetaOcupacion.astro` — recibe `ocupacion` (tipo `Ocupacion`). Es un `<li>` con una tarjeta `rounded-base border border-borde bg-fondo p-4` que contiene:
- `<h2 class="text-xl">` con un enlace a `/ocupaciones/<id>/` cuyo texto es `nombreCorto` (todo el enlace es el nombre: así el nombre accesible es único);
- un párrafo `text-base text-texto-suave` con `También: ` + los `puestos` unidos con `, `;
- el código del perfil `CNPO <codigo>` en `text-sm text-texto-suave`.

`src/pages/ocupaciones/index.astro` — `Base` con `titulo="Elige tu ocupación"` y `descripcion="Elige la ocupación en la que trabajas para ver a qué trabajos afines puedes pasar."`; importa `ocupaciones` de `../../lib/datos.ts`; contiene `<h1>Elige tu ocupación</h1>`, el párrafo `Toca la ocupación en la que trabajas o trabajaste. Te mostraremos los trabajos afines según el CNPO.` y una `<ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">` con una `TarjetaOcupacion` por ocupación, en el orden de `ocupaciones.json`.

`e2e/ocupaciones.spec.ts` — comprueba: `/ocupaciones/` responde 200; el `h1` es `Elige tu ocupación` y el título `Elige tu ocupación | Reconversión Laboral`; para cada uno de los 9 ids (`almacen`, `atencion_telefonica`, `caja_comercial`, `caja_financiera`, `housekeeping`, `lavanderia`, `limpieza`, `salon_comidas`, `trabajador_hogar`) existe exactamente un enlace con `href` `/ocupaciones/<id>/` dentro de `main`; el enlace de `caja_comercial` tiene el texto `Cajero(a) de tienda`; con 360 px de ancho, `document.documentElement.scrollWidth` es menor o igual a 360.

Al final: `npm run format`.

Archivos que toca este paso (*Files touched*): `src/pages/ocupaciones/index.astro`, `src/components/TarjetaOcupacion.astro`, `e2e/ocupaciones.spec.ts`.

**Done when**

- [ ] WHEN `/ocupaciones/` se carga THE SYSTEM SHALL responder 200, mostrar el `h1` `Elige tu ocupación` y tener el título `Elige tu ocupación | Reconversión Laboral`.
- [ ] WHEN `/ocupaciones/` se carga THE SYSTEM SHALL mostrar dentro de `main` exactamente un enlace a `/ocupaciones/<id>/` por cada uno de los 9 ids de `ocupaciones.json`, y el de `caja_comercial` SHALL tener el texto `Cajero(a) de tienda`.
- [ ] WHEN `/ocupaciones/` se abre con 360 px de ancho THE SYSTEM SHALL tener `document.documentElement.scrollWidth` menor o igual a 360.
- [ ] WHEN se inspecciona `dist/ocupaciones/index.html` después de `npm run build` THE SYSTEM SHALL no contener ninguna etiqueta `<script`.
- [ ] WHEN `npx playwright test e2e/ocupaciones.spec.ts` y `npm run check` se ejecutan THE SYSTEM SHALL terminar ambos con código 0.

**Verify**

```bash
npm run build   # expect: exit 0
status=0; grep -q '<script' dist/ocupaciones/index.html || status=$?; test "$status" -eq 1   # expect: exit 0 — 1 = sin JavaScript de cliente · 2 = archivo inexistente, y eso ahora falla
npm run check   # expect: exit 0 — astro check sin errores y biome check sin diagnósticos de error
npx playwright test e2e/ocupaciones.spec.ts   # expect: exit 0, 0 fallidas
```

**Checkpoint**

```bash
git add -A && git commit -m "paso 09: Directorio de ocupaciones (E4-T2)" && git tag paso-09
# si este paso sale mal antes de completarse: git reset --hard inicio-paso-09 (conserva los commits "codex: correcciones etapa …" anteriores)
```

---

#### Paso 10 — Ranking de destinos por ocupación

*Tarea `E4-T3` · épica `04-paginas` · depende de: paso 9*

**Do**

Antes de empezar: `git tag -f inicio-paso-10` (punto de retorno de este paso).

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

Archivos que toca este paso (*Files touched*): `src/pages/ocupaciones/[id].astro`, `src/components/FilaDestino.astro`, `src/components/InsigniaDemanda.astro`, `e2e/ocupacion.spec.ts`.

**Done when**

- [ ] WHEN `npm run build` se ejecuta THE SYSTEM SHALL generar `dist/ocupaciones/<id>/index.html` para cada uno de los 9 ids de `ocupaciones.json`.
- [ ] WHEN `/ocupaciones/caja_comercial/` se carga THE SYSTEM SHALL mostrar el `h1` `De Cajero(a) de tienda a otros trabajos` y exactamente 8 elementos `[data-testid="destino"]`, sin ningún enlace a `/transicion/caja_comercial/caja_comercial/`.
- [ ] WHEN se leen en orden los `data-afinidad` de esos 8 elementos THE SYSTEM SHALL encontrarlos en orden no creciente.
- [ ] WHEN se lee cada fila de destino THE SYSTEM SHALL mostrar el texto `Ya tienes el <N> % de lo que pide este trabajo`, una insignia `Demanda referencial: Alta`, `Demanda referencial: Media` o `Demanda referencial: Baja`, y un enlace a `/transicion/caja_comercial/<destino>/`.
- [ ] WHEN `/ocupaciones/caja_comercial/` se carga THE SYSTEM SHALL mostrar la nota `Se reemplazará con la Encuesta de Demanda Ocupacional 2026 del MTPE` y, con 360 px de ancho, `scrollWidth` menor o igual a 360.
- [ ] WHEN `npx playwright test e2e/ocupacion.spec.ts` y `npm run check` se ejecutan THE SYSTEM SHALL terminar ambos con código 0.

**Verify**

```bash
npm run build   # expect: exit 0
test "$(ls dist/ocupaciones/*/index.html | wc -l)" -eq 9   # expect: exit 0 — una página por ocupación de ocupaciones.json
npm run check   # expect: exit 0 — astro check sin errores y biome check sin diagnósticos de error
npx playwright test e2e/ocupacion.spec.ts   # expect: exit 0, 0 fallidas
```

**Checkpoint**

```bash
git add -A && git commit -m "paso 10: Ranking de destinos por ocupación (E4-T3)" && git tag paso-10
# si este paso sale mal antes de completarse: git reset --hard inicio-paso-10 (conserva los commits "codex: correcciones etapa …" anteriores)
```

---

#### Paso 11 — Páginas de transición con evidencia y cursos

*Tarea `E4-T4` · épica `04-paginas` · depende de: paso 10*

**Do**

Antes de empezar: `git tag -f inicio-paso-11` (punto de retorno de este paso).

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

Archivos que toca este paso (*Files touched*): `src/pages/transicion/[origen]/[destino].astro`, `src/components/ChipCompetencia.astro`, `src/components/ItemPorFortalecer.astro`, `e2e/transicion.spec.ts`.

**Done when**

- [ ] WHEN `npm run build` se ejecuta THE SYSTEM SHALL generar 72 páginas `dist/transicion/<origen>/<destino>/index.html` (9 orígenes × 8 destinos) y ninguna con origen igual a destino.
- [ ] WHEN `/transicion/caja_comercial/almacen/` se carga THE SYSTEM SHALL mostrar el `h1` `De Cajero(a) de tienda a Operario(a) de almacén` y un resumen `Ya tienes el <N> % de lo que pide este trabajo`.
- [ ] WHEN se lee cada competencia de la sección `Ya lo tienes` THE SYSTEM SHALL mostrar la etiqueta de texto `Ya lo tienes` y evidencia con ids de elemento del origen que empiezan con `G2347002-` y del destino que empiezan con `H2452001-`.
- [ ] WHEN se lee cada competencia de la sección `Por fortalecer` THE SYSTEM SHALL mostrar la etiqueta de texto `Por fortalecer`, evidencia del destino que empieza con `H2452001-`, el texto `Busca el tema «<tema>» en Capacíta-T (gratuito)` y un enlace a `https://capacitacionlaboral.trabajo.gob.pe/`.
- [ ] WHEN cualquiera de las páginas de transición probadas se carga THE SYSTEM SHALL mostrar `Esta es una orientación preliminar. No evalúa ni certifica; la certificación la otorgan entidades autorizadas.`
- [ ] WHEN `npx playwright test e2e/transicion.spec.ts` y `npm run check` se ejecutan THE SYSTEM SHALL terminar ambos con código 0.

**Verify**

```bash
npm run build   # expect: exit 0
test "$(ls dist/transicion/*/*/index.html | wc -l)" -eq 72   # expect: exit 0 — 9 × 8 pares ordenados
status=0; test -e dist/transicion/caja_comercial/caja_comercial/index.html || status=$?; test "$status" -eq 1   # expect: exit 0 — 1 = no existe la transición de una ocupación a sí misma
npm run check   # expect: exit 0 — astro check sin errores y biome check sin diagnósticos de error
npx playwright test e2e/transicion.spec.ts   # expect: exit 0, 0 fallidas
```

**Checkpoint**

```bash
git add -A && git commit -m "paso 11: Páginas de transición con evidencia y cursos (E4-T4)" && git tag paso-11
# si este paso sale mal antes de completarse: git reset --hard inicio-paso-11 (conserva los commits "codex: correcciones etapa …" anteriores)
```

---

#### Paso 12 — Traductor por palabras clave y sugerencias

*Tarea `E5-T1` · épica `05-entrevista` · depende de: paso 7*

**Do**

Antes de empezar: `git tag -f inicio-paso-12` (punto de retorno de este paso).

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

Archivos que toca este paso (*Files touched*): `src/lib/traductor/tipos.ts`, `src/lib/traductor/palabras-clave.ts`, `src/lib/sugerencias.ts`, `tests/traductor.test.ts`.

**Done when**

- [ ] WHEN el traductor de palabras clave recibe `cobro con yape y cuadro la caja al cierre` THE SYSTEM SHALL detectar `C03` por `yape` y `C04` por `cuadro`.
- [ ] WHEN el traductor recibe `Uso lejía para desinfectar los baños` THE SYSTEM SHALL detectar `C11` por `lejia`, ignorando tildes y mayúsculas.
- [ ] WHEN el traductor recibe un relato vacío o solo con espacios THE SYSTEM SHALL devolver una lista vacía.
- [ ] WHEN el traductor recibe `posada` THE SYSTEM SHALL no detectar `C03`, porque la palabra clave `pos` solo coincide como palabra completa.
- [ ] WHEN `sugerirOcupaciones` recibe `["C01"]` con el conjunto mínimo de prueba THE SYSTEM SHALL devolver `d`, `c` y `a` en ese orden con coberturas 1, 1 y 0.4, y con datos reales SHALL devolver como máximo 3 ocupaciones, todas con cobertura mayor que 0 y en orden no creciente.
- [ ] WHEN `npm run check` y `npm test` se ejecutan THE SYSTEM SHALL terminar ambos con código 0.

**Verify**

```bash
npx vitest run tests/traductor.test.ts   # expect: exit 0, 0 fallidas, 0 omitidas
npm test   # expect: exit 0 — ninguna prueba anterior se rompió
npm run check   # expect: exit 0 — astro check sin errores y biome check sin diagnósticos de error
```

**Checkpoint**

```bash
git add -A && git commit -m "paso 12: Traductor por palabras clave y sugerencias (E5-T1)" && git tag paso-12
# si este paso sale mal antes de completarse: git reset --hard inicio-paso-12 (conserva los commits "codex: correcciones etapa …" anteriores)
```

---

#### Paso 13 — Isla de entrevista sin guardar datos

*Tarea `E5-T2` · épica `05-entrevista` · depende de: paso 8, paso 12*

**Do**

Antes de empezar: `git tag -f inicio-paso-13` (punto de retorno de este paso).

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

Archivos que toca este paso (*Files touched*): `src/components/islas/Entrevista.tsx`, `src/pages/entrevista.astro`, `e2e/entrevista.spec.ts`.

**Done when**

- [ ] WHEN `/entrevista/` se carga THE SYSTEM SHALL mostrar el `h1` `Cuéntanos tu experiencia`, las 3 preguntas como etiquetas de 3 campos de texto y el aviso `Traducción simulada por palabras clave. En la versión final la realizará la IA local QVAC de Tether.`
- [ ] WHEN se escribe `cobro con yape y cuadro la caja al cierre` en la primera pregunta y se pulsa `Ver mis competencias` THE SYSTEM SHALL mostrar la competencia `Cobro con medios de pago electrónicos` y entre 1 y 3 enlaces a `/ocupaciones/<id>/`.
- [ ] WHEN se pulsa `Ver mis competencias` con todas las respuestas de menos de 15 caracteres THE SYSTEM SHALL mostrar en un elemento `role="alert"` el texto `Escribe al menos 15 caracteres en alguna de las respuestas.` y no mostrar resultados.
- [ ] WHEN la respuesta `me gusta mucho el futbol los domingos` se envía THE SYSTEM SHALL mostrar `No encontramos competencias en lo que escribiste. Cuéntanos con más detalle qué haces en tu trabajo.`
- [ ] WHEN se completa el flujo de la entrevista THE SYSTEM SHALL no hacer ninguna petición de red después del clic y dejar `localStorage.length` y `sessionStorage.length` en 0.
- [ ] WHEN `npx playwright test e2e/entrevista.spec.ts` y `npm run check` se ejecutan THE SYSTEM SHALL terminar ambos con código 0.

**Verify**

```bash
npm run check   # expect: exit 0 — astro check sin errores y biome check sin diagnósticos de error
npx playwright test e2e/entrevista.spec.ts   # expect: exit 0, 0 fallidas
```

**Checkpoint**

```bash
git add -A && git commit -m "paso 13: Isla de entrevista sin guardar datos (E5-T2)" && git tag paso-13
# si este paso sale mal antes de completarse: git reset --hard inicio-paso-13 (conserva los commits "codex: correcciones etapa …" anteriores)
```

---

#### Paso 14 — Metodología, 404, accesibilidad y E2E completo

*Tarea `E6-T1` · épica `06-calidad-publicacion` · depende de: paso 8, paso 11, paso 13*

**Do**

Antes de empezar: `git tag -f inicio-paso-14` (punto de retorno de este paso).

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

Archivos que toca este paso (*Files touched*): `src/pages/acerca.astro`, `src/pages/404.astro`, `e2e/rutas.spec.ts`, `e2e/accesibilidad.spec.ts`.

**Done when**

- [ ] WHEN `e2e/rutas.spec.ts` visita `/`, `/ocupaciones/`, `/ocupaciones/caja_comercial/`, `/ocupaciones/limpieza/`, `/ocupaciones/salon_comidas/`, `/transicion/caja_comercial/almacen/`, `/transicion/limpieza/housekeeping/`, `/transicion/salon_comidas/atencion_telefonica/`, `/entrevista/` y `/acerca/` THE SYSTEM SHALL responder 200 en cada una y mostrar su `h1` esperado y el aviso de prototipo.
- [ ] WHEN se visita `/ruta-que-no-existe/` THE SYSTEM SHALL mostrar el texto `No encontramos esta página` y un enlace `Volver al inicio` a `/`.
- [ ] WHEN `/acerca/` se carga THE SYSTEM SHALL contener `CNPO`, `Demanda referencial` y `H2452004`.
- [ ] WHEN `e2e/accesibilidad.spec.ts` ejecuta axe con las etiquetas `wcag2a` y `wcag2aa` sobre `/`, `/ocupaciones/`, `/ocupaciones/caja_comercial/`, `/transicion/caja_comercial/almacen/` y `/entrevista/` THE SYSTEM SHALL encontrar 0 violaciones de impacto `critical` o `serious`.
- [ ] WHEN esas 5 páginas se abren con 360 px de ancho THE SYSTEM SHALL tener `document.documentElement.scrollWidth` menor o igual a 360 en todas.
- [ ] WHEN `npm run check`, `npm test` y `npx playwright test` se ejecutan THE SYSTEM SHALL terminar los tres con código 0.

**Verify**

```bash
npm run check   # expect: exit 0 — astro check sin errores y biome check sin diagnósticos de error
npm test   # expect: exit 0, 0 fallidas
npx playwright test   # expect: exit 0, 0 fallidas — toda la carpeta e2e/, en chromium y movil
test -f dist/404.html   # expect: exit 0 — Playwright dejó construido el sitio con la página 404
```

**Checkpoint**

```bash
git add -A && git commit -m "paso 14: Metodología, 404, accesibilidad y E2E completo (E6-T1)" && git tag paso-14
# si este paso sale mal antes de completarse: git reset --hard inicio-paso-14 (conserva los commits "codex: correcciones etapa …" anteriores)
```

---

#### Paso 15 — Preparación de la publicación en Cloudflare Pages

*Tarea `E6-T2` · épica `06-calidad-publicacion` · depende de: paso 14*

**Do**

Antes de empezar: `git tag -f inicio-paso-15` (punto de retorno de este paso).

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

Archivos que toca este paso (*Files touched*): `public/_headers`, `docs/PUBLICAR.md`.

**Done when**

- [ ] WHEN `npm run build` se ejecuta THE SYSTEM SHALL copiar `public/_headers` a `dist/_headers`.
- [ ] WHEN se lee `dist/_headers` THE SYSTEM SHALL contener las cabeceras `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` y `Content-Security-Policy:` para la ruta `/*`.
- [ ] WHEN `npx wrangler --version` se ejecuta THE SYSTEM SHALL terminar con código 0 usando el wrangler local instalado desde `package.json`.
- [ ] WHEN se lee `docs/PUBLICAR.md` THE SYSTEM SHALL contener los comandos `npx wrangler login` y `npm run deploy` y el dominio `.pages.dev`.
- [ ] WHEN `npm run check` se ejecuta THE SYSTEM SHALL terminar con código 0.

**Verify**

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

**Checkpoint**

```bash
git add -A && git commit -m "paso 15: Preparación de la publicación en Cloudflare Pages (E6-T2)" && git tag paso-15
# si este paso sale mal antes de completarse: git reset --hard inicio-paso-15 (conserva los commits "codex: correcciones etapa …" anteriores)
```

---

### 9.1 Parity and cutover

NOT APPLICABLE — greenfield build, no system is being replaced.

---

## 10. Environment Setup

### Prerequisites

| Herramienta | Versión | Comprobación |
|---|---|---|
| Node.js | 24.22.1 LTS (instalado en `C:/Program Files/nodejs`) | `node -v` → `v24.22.1` |
| npm | 11.19.1 (viene con Node) | `npm -v` → `11.19.1` |
| Git (con Git Bash) | 2.55 | `git --version` |
| Carpeta con los PDF del CNPO | `C:/Users/Home/Pictures/TETHER/innova/perfiles - copia/` con los 9 PDF de la lista del paso 3 | `ls "C:/Users/Home/Pictures/TETHER/innova/perfiles - copia"` |
| Conexión a internet | para `npm install` y la descarga de Chromium | — |
| Plugin de Claude Code `codex@openai-codex` (instalado a nivel de usuario) y Codex CLI con sesión de ChatGPT | 1.0.6 / 0.164.0 en esta máquina (2026-10-24) — **opcional**: sin él, la revisión de Codex al cerrar cada épica deja constancia del fallo y la construcción sigue | `ls ~/.claude/plugins/cache/openai-codex/codex/` |

**Si `node -v` responde "command not found" en Git Bash** (el directorio de Node no está en el PATH de Git Bash), ejecuta una vez `echo 'export PATH="/c/Program Files/nodejs:$PATH"' >> ~/.bashrc` y abre una sesión nueva de Git Bash o de Claude Code. El Bootstrap trae la misma línea como guarda para su propia ejecución.

No hace falta configurar una identidad global de git: el Bootstrap fija una identidad **local del repositorio** solo si falta. No se usan pnpm ni corepack (ver §20.3).

### Accounts to create first

| Servicio | Para qué | Dónde | Lo necesita |
|---|---|---|---|
| Cloudflare (plan Free) | Publicar el sitio en `*.pages.dev` | `https://dash.cloudflare.com/sign-up` | Solo la lista de lanzamiento de §20.1 (humana). Ningún paso de §9 la necesita |

### Environment variables

| Variable | Propósito | Dónde obtenerla | Requerida desde el paso | ¿Secreta? |
|---|---|---|---|---|
| `PERFILES_ORIGEN` | Carpeta de origen de los PDF del CNPO para `scripts/copiar-perfiles.mjs` | Opcional. Por defecto el script usa `C:/Users/Home/Pictures/TETHER/innova/perfiles - copia` | nunca obligatoria (la usa el paso 3, con valor por defecto) | no |
| `CLAUDE_PROJECT_DIR` | Raíz del proyecto para `scripts/codex-revision-etapa.mjs` | La define Claude Code al ejecutar hooks; si falta, el script usa `process.cwd()` | nunca obligatoria (solo el hook la lee) | no |

**No hay `.env` ni `.env.example`.** El sitio no lee variables de entorno, no hay secretos y ninguna puerta necesita una variable. `PERFILES_ORIGEN` la lee directamente `scripts/copiar-perfiles.mjs` con `process.env.PERFILES_ORIGEN || <ruta por defecto>`; ningún archivo la carga y no hace falta: si no está definida, se usa la ruta por defecto en todas partes donde aparece el comando (§9 paso 3, §19.1, §20.1). La sesión de Cloudflare la crea una persona con `npx wrangler login` y wrangler la guarda en su propia configuración de usuario, fuera del repositorio.

### Files that must be committed

| Archivo | Por qué se versiona | Línea de excepción en `.gitignore` |
|---|---|---|
| `package.json`, `package-lock.json`, `.nvmrc` | Instalación reproducible (`npm ci` en §20.1) | — no lo cubre ningún patrón |
| `.gitignore`, `.gitattributes`, `astro.config.mjs`, `tsconfig.json`, `biome.json`, `vitest.config.ts`, `playwright.config.ts` | Configuración que necesitan las puertas | — no lo cubre ningún patrón |
| `CLAUDE.md`, `AGENTS.md`, `.claude/settings.json`, `.claude/agents/**`, `.claude/skills/**`, `.claude/rules/**` | Configuración del agente coordinador y del subagente constructor | — no lo cubre ningún patrón (`.gitignore` no menciona `.claude/`) |
| `fuentes/perfiles/*.pdf`, `fuentes/texto/*.txt` | Fuente de verdad de los datos; la máquina del Demo Day puede no tener la carpeta de origen | — no lo cubre ningún patrón |
| `src/data/*.json` | El dataset del producto | — no lo cubre ningún patrón |
| `public/_headers`, `docs/PUBLICAR.md` | Publicación | — no lo cubre ningún patrón (`dist/` no coincide con `public/`) |
| `scripts/codex-revision-etapa.mjs`, `docs/revisiones-codex/*.md` | Hook de revisión y sus informes: dejan constancia de cada revisión de Codex | — no lo cubre ningún patrón |
| `blueprints/reconversion-laboral/**` (incluye `tasks.json` con el estado de cada tarea) | Permite reanudar la construcción en otra sesión | — no lo cubre ningún patrón |

`.gitignore` (emitido en `workspace/`, §19.6) solo excluye `node_modules/`, `dist/`, `.astro/`, `test-results/`, `playwright-report/`, `.wrangler/`, `.env` y `.env.*`. Ningún archivo de esta tabla coincide con esos patrones, por eso no hace falta ninguna negación. Llega con la copia de `workspace/`, **antes** del primer commit, junto con `.gitattributes` (`* text=auto eol=lf`, `*.pdf binary`, `*.png binary`): esta máquina tiene `core.autocrlf=true` (sistema y global), y sin ese archivo un `git clone` o un `git reset --hard` deja los archivos con CRLF y `npx biome check .` falla. Como `.gitattributes` está en el primer commit, todo lo que se versione después ya entra normalizado a LF.

### Bootstrap

```bash
# Ejecutar en Git Bash desde la raíz del proyecto: C:/Users/Home/Pictures/TETHER/reconversion-laboral
# El orden importa: PATH de Node → copia de workspace/ (trae .gitignore, biome.json, tsconfig.json y package.json)
#   → repositorio e identidad local → instalación → navegador de Playwright → formato → primer commit.
# Es seguro ejecutarlo dos veces: cada línea termina con 0 cuando no tiene nada que hacer.
command -v node >/dev/null 2>&1 || export PATH="/c/Program Files/nodejs:$PATH"   # Node está instalado pero puede no estar en el PATH de Git Bash
node -v                                                # expect: v24.22.1
cp -R blueprints/reconversion-laboral/workspace/. .    # copiar y re-derivar: ningún paso de §9 edita estos archivos (CLAUDE.md, regla 4), así que sobrescribirlos los deja iguales; package-lock.json no viene en workspace/ y nunca se sobrescribe; las dos líneas de npm y biome de abajo re-derivan dependencias y formato
git rev-parse --git-dir >/dev/null 2>&1 || git init -b main                          # idempotente: no hace nada si ya es un repositorio
git config user.name >/dev/null || git config user.name "Equipo Reconversion Laboral"  # identidad local solo si falta (no hay identidad global)
git config user.email >/dev/null || git config user.email "equipo@reconversion.local"
npm install                                            # crea o respeta package-lock.json; exit 0 también la segunda vez
npx playwright install chromium                        # descarga Chromium una vez; la segunda vez no hace nada y termina con 0
npx biome check --write .                              # alinea el formato de lo copiado con biome.json (no toca blueprints/, excluido)
npx biome check .                                      # expect: exit 0 — la primera puerta, con la carpeta blueprints/ presente
git rev-parse --verify --quiet HEAD >/dev/null || { git add -A && git commit -m "chore: bootstrap desde workspace/"; }   # el primer commit solo si no existe; los tags de §9 necesitan un commit al que apuntar
```

**Si `npm install` avisa** `2 packages have install scripts not yet covered by allowScripts: esbuild…, workerd…`: es solo un aviso de npm 11; el build, las pruebas y `npx wrangler --version` funcionan sin esos scripts (verificado el 2026-10-26). Si más adelante `wrangler pages deploy` falla por `workerd`, una persona ejecuta `npm install-scripts approve workerd` y luego `npm install`. El Bootstrap no cambia.

Un ejecutor desatendido corre este bloque con `set -e`; todas las líneas están escritas para terminar con 0 en la primera y en la segunda ejecución. `cp -R` se usa sin `-n` a propósito: en Git Bash es el `cp` de GNU, y la protección contra sobrescribir aquí no hace falta porque los archivos de `workspace/` son de solo lectura para el constructor y `package-lock.json` no está entre ellos.

---

## 11. Dependencies

**Procedencia:** todas las versiones se verificaron en vivo el **2026-10-24** con `npm view <paquete> dist-tags` contra `https://registry.npmjs.org/<paquete>` (estado VERIFIED, ninguna es prerelease). Todas se instalan con un solo comando: `npm install` en el Bootstrap de §10, que lee el `package.json` emitido en `workspace/` (§19.6) con versiones exactas, sin `^`. Ningún paso de §9 instala paquetes.

### Runtime

| Paquete | Versión | Fuente | Verificado | Instalado por | Propósito |
|---|---|---|---|---|---|
| Node.js | 24.22.1 LTS | `node -v` en esta máquina | 2026-10-24 | Prerrequisitos de §10 (instalación humana) | Runtime; `astro` exige `>=22.23.4`, `pdfjs-dist` `>=22.13 \|\| >=24` |
| npm | 11.19.1 | `npm -v` en esta máquina | 2026-10-24 | viene con Node | Gestor de paquetes |
| `astro` | 7.1.1 | https://registry.npmjs.org/astro | 2026-10-24 | §10 Bootstrap — `npm install` | Framework estático; depende de `vite ^8.3.4` |
| `@astrojs/react` | 7.1.1 | https://registry.npmjs.org/@astrojs/react | 2026-10-24 | §10 Bootstrap — `npm install` | Integración de la isla React |
| `react` | 19.3.1 | https://registry.npmjs.org/react | 2026-10-24 | §10 Bootstrap — `npm install` | Isla de la entrevista |
| `react-dom` | 19.3.1 | https://registry.npmjs.org/react-dom | 2026-10-24 | §10 Bootstrap — `npm install` | Hidratación de la isla |
| `zod` | 4.6.7 | https://registry.npmjs.org/zod | 2026-10-24 | §10 Bootstrap — `npm install` | Esquemas de datos (`src/lib/esquemas.ts`) |
| `tailwindcss` | 4.3.3 | https://registry.npmjs.org/tailwindcss | 2026-10-24 | §10 Bootstrap — `npm install` | Estilos con tokens `@theme` |
| `@tailwindcss/vite` | 4.3.3 | https://registry.npmjs.org/@tailwindcss/vite | 2026-10-24 | §10 Bootstrap — `npm install` | Plugin de Vite para Tailwind (peer `vite ^5.2 \|\| ^6 \|\| ^7 \|\| ^8`) |

### Development

| Paquete | Versión | Fuente | Verificado | Instalado por | Propósito |
|---|---|---|---|---|---|
| `typescript` | 6.0.3 | https://registry.npmjs.org/typescript | 2026-10-24 | §10 Bootstrap — `npm install` | Tipos; línea 6 porque `@astrojs/check` acepta `^5 \|\| ^6` |
| `@astrojs/check` | 0.9.12 | https://registry.npmjs.org/@astrojs/check | 2026-10-24 | §10 Bootstrap — `npm install` | `astro check` en `npm run check` |
| `@types/react` | 19.3.0 | https://registry.npmjs.org/@types/react | 2026-10-24 | §10 Bootstrap — `npm install` | Tipos de React (peer de `@astrojs/react`) |
| `@types/react-dom` | 19.3.0 | https://registry.npmjs.org/@types/react-dom | 2026-10-24 | §10 Bootstrap — `npm install` | Tipos de React DOM |
| `@types/node` | 24.19.2 | https://registry.npmjs.org/@types/node | 2026-10-24 | §10 Bootstrap — `npm install` | Tipos de `node:fs` en pruebas (peer de Vitest `^22 \|\| >=24`) |
| `vitest` | 5.0.5 | https://registry.npmjs.org/vitest | 2026-10-24 | §10 Bootstrap — `npm install` | Pruebas unitarias (peer `vite ^6.4 \|\| ^7 \|\| ^8`) |
| `@playwright/test` | 1.64.1 | https://registry.npmjs.org/@playwright/test | 2026-10-24 | §10 Bootstrap — `npm install` | Pruebas E2E |
| `@axe-core/playwright` | 4.14.0 | https://registry.npmjs.org/@axe-core/playwright | 2026-10-24 | §10 Bootstrap — `npm install` | Escaneo de accesibilidad en E2E |
| `@biomejs/biome` | 2.6.3 | https://registry.npmjs.org/@biomejs/biome | 2026-10-24 | §10 Bootstrap — `npm install` | Lint y formato (`!!` de exclusión forzada desde la 2.2) |
| `pdfjs-dist` | 6.4.299 | https://registry.npmjs.org/pdfjs-dist | 2026-10-24 | §10 Bootstrap — `npm install` | Extracción de texto en `scripts/extraer-texto.mjs` |
| `wrangler` | 4.152.0 | https://registry.npmjs.org/wrangler | 2026-10-24 | §10 Bootstrap — `npm install` | Publicación en Cloudflare Pages (`npm run deploy`, humano) |
| Chromium de Playwright | la que trae `@playwright/test` 1.64.1 (no se fija aparte) | `npx playwright install chromium` | 2026-10-24 | §10 Bootstrap — `npx playwright install chromium` | Navegador de las pruebas E2E |

**18 paquetes fijados en `package.json`** (7 dependencias y 11 de desarrollo; más Node, npm y Chromium arriba). **Peers opcionales sin fijar, con evidencia (2026-10-24):** `npm view astro@7.1.1 peerDependencies peerDependenciesMeta` declara `@astrojs/markdown-remark` exacto `7.2.1` y opcional, y `@vitejs/plugin-react@6.1.2` declara `oxc-transform-react ^0.152.0` opcional frente al `^0.145.0` de `@astrojs/react@7.1.1`. Con ambos fijados, `npm install` falló con `ERESOLVE`; sin ellos terminó con 0 y ninguno quedó instalado (comprobado de nuevo con `npm install --package-lock-only`). El proyecto no usa Markdown ni el compilador de React de oxc.

`vite` no se fija: llega como dependencia transitiva de `astro` (`^8.3.4`) y satisface los peers de `vitest` y `@tailwindcss/vite`; su versión exacta queda en `package-lock.json`.

### Deliberately not used

| Rechazado | En su lugar | Por qué |
|---|---|---|
| pnpm / corepack | npm | `corepack enable` necesita permisos de administrador sobre `C:/Program Files/nodejs`; el usuario no es programador |
| `typescript` 7.x | 6.0.3 | `@astrojs/check` no lo acepta; rompería `npm run check` |
| `tailwind.config.js`, `@tailwindcss/postcss` | `@theme` en CSS + `@tailwindcss/vite` | Tailwind 4 es CSS-first; Astro usa Vite |
| ESLint + Prettier | Biome | Una sola herramienta y un archivo |
| `@astrojs/cloudflare` (adaptador SSR) | salida estática | No hay servidor; un adaptador agregaría runtime sin uso |
| Fuentes web (Google Fonts, `@fontsource/*`) | pila del sistema | Cero peticiones externas y mejor rendimiento en celulares de gama baja |
| Analítica (Cloudflare Web Analytics, GA) | nada | Promesa de no guardar datos del usuario |
| `@astrojs/markdown-remark` fijado | sin fijar (peer opcional) | Fijado en 7.3.4 choca con el peer exacto `7.2.1` de Astro 7.1.1 (`ERESOLVE`); no usamos Markdown |
| `oxc-transform-react` fijado | sin fijar (peer opcional) | `@astrojs/react` pide `^0.145.0` y `@vitejs/plugin-react` `^0.152.0`: fijarlo genera conflicto; no hace falta |
| SDK de QVAC / cualquier LLM | traductor por palabras clave | Fuera de v1 (§1); la costura de §5 lo deja listo |

---

## 12. Deployment Strategy

### Hosting

**Cloudflare Pages, plan Free ($0, uso comercial permitido), subida directa con wrangler**, sin integración con GitHub. Comando de construcción `npm run build`, directorio de salida `dist`, sin runtime de servidor. El script `deploy` de `package.json` ejecuta `npm run build && wrangler pages deploy dist --project-name=reconversion-laboral --branch=main`. El primer despliegue crea el proyecto `reconversion-laboral`. `public/_headers` (paso 15) se copia a `dist/_headers` y Cloudflare aplica esas cabeceras.

### Environments

| Entorno | Rama | URL | Base de datos | Modo de terceros |
|---|---|---|---|---|
| Local | — | `http://localhost:4321` (`npm run dev`) · `http://127.0.0.1:4321` (`npm run preview`) | ninguna (JSON en el repositorio) | sin terceros |
| Preview | NOT APPLICABLE — sin integración con git ni PR | — | — | — |
| Producción | `main` | `https://reconversion-laboral.pages.dev` (o la URL `*.pages.dev` que imprima wrangler si el nombre está tomado) | ninguna | sin terceros |

### CI/CD

No hay CI remoto (el repositorio es local). La puerta de §20.1 se ejecuta a mano, completa, antes de cada `npm run deploy`; reúne las comprobaciones de los pasos 14 y 15 más `npm ci`. Orden: `npm ci` → `npm run check` → `npm test` → `npm run test:e2e` → `npm run build` → `npm run deploy` (humano).

### Release and rollback

Publicar = `npm run deploy` (una persona, después de `npx wrangler login`). Revertir: en el panel de Cloudflare Pages → *Deployments* → un despliegue anterior → *Rollback to this deployment* (inmediato), o `git checkout paso-15 && npm run deploy && git checkout main` (unos 2 minutos). No hay migraciones.

### Domain, DNS, TLS

Sin dominio propio en v1 (no-objetivo de §1). `*.pages.dev` trae HTTPS con certificado gestionado por Cloudflare; no hay registros DNS que crear ni redirecciones.

---

## 13. Testing Strategy

Las pruebas existen para que los "Done when" de §9 sean decidibles por una máquina.

| Capa | Framework | Qué cubre | Dónde | Cuándo |
|---|---|---|---|---|
| Unitaria | Vitest | Extracción de texto, esquemas de datos, integridad del mapeo, fórmula de afinidad (conjunto a mano + 72 pares reales), traductor y sugerencias | `tests/**/*.test.ts` | en cada paso desde el 3 (`npm test`) |
| Integración | Vitest | Los cinco JSON reales cargados por `src/lib/datos.ts` a través del motor | `tests/afinidad.test.ts`, `tests/traductor.test.ts` | en cada paso desde el 7 |
| E2E | Playwright (proyectos `chromium` y `movil` 360×740) + `@axe-core/playwright` | Sitio construido y servido: rutas, textos legales, ranking, transición, entrevista, 404, axe, ancho de 360 px | `e2e/*.spec.ts` | en los pasos 1, 2, 8–11, 13 y 14; completo antes de publicar |

### Critical flows to cover E2E

1. Portada → directorio → ranking de `caja_comercial` → transición `caja_comercial → almacen`, con evidencia del CNPO y enlace a Capacíta-T (`e2e/portada.spec.ts`, `ocupaciones.spec.ts`, `ocupacion.spec.ts`, `transicion.spec.ts`).
2. Entrevista: relato con palabras clave → competencias y ocupaciones parecidas, sin peticiones de red ni almacenamiento (`e2e/entrevista.spec.ts`).
3. Accesibilidad y celular: axe sin violaciones serias/críticas y sin scroll horizontal a 360 px en las 5 páginas clave (`e2e/accesibilidad.spec.ts`).

### Test data

Las pruebas unitarias usan los JSON reales de `src/data/` (solo lectura) y el conjunto mínimo `tests/fixtures/datos-minimos.ts`, cuyos valores esperados están calculados a mano en el paso 7. Ninguna prueba escribe archivos ni comparte estado. Las E2E corren contra el sitio construido por `playwright.config.ts` (`npm run build && npm run preview`); no hay servicios ni bases de datos que levantar.

### What is deliberately not tested

- Que `public/_headers` funcione en producción: `astro preview` no lo aplica; se revisa `dist/_headers` en el paso 15 y el sitio publicado en la lista de lanzamiento.
- Que el enlace a Capacíta-T responda: necesita red; `npm run verificar-enlaces` está en §20.1.
- Que el mapeo sea "correcto" a juicio del MTPE: las pruebas comprueban evidencia e integridad, no el criterio experto (riesgo 1 de §20.2).
- Lectores de pantalla y teclado a fondo: pasada manual en §20.1.

---

## 14. Security & Secrets

| Tema | Control | Implementado en |
|---|---|---|
| Almacenamiento de secretos | No hay secretos en el proyecto; la sesión de wrangler vive en la configuración de usuario de wrangler, fuera del repo | — |
| Rotación de secretos | NOT APPLICABLE — sin secretos; la sesión de wrangler se cierra con `npx wrangler logout` tras el Demo Day | lista de lanzamiento (§20.1) |
| Validación de entrada | Datos: zod al construir (`src/lib/datos.ts`). Relatos de la entrevista: solo se comparan con expresiones regulares construidas a partir del catálogo, nunca se interpretan como HTML | `src/lib/esquemas.ts`, `src/lib/traductor/palabras-clave.ts` |
| Codificación de salida / XSS | Astro y React escapan todo el texto; no se usa `set:html` ni `dangerouslySetInnerHTML` | todas las páginas |
| Inyección SQL | NOT APPLICABLE — no hay base de datos | — |
| AuthN / AuthZ | NOT APPLICABLE — sin cuentas ni sesiones | — |
| CSRF | NOT APPLICABLE — no hay formularios que se envíen a un servidor | — |
| Abuso / límites | El CDN de Cloudflare; no hay endpoints | Cloudflare Pages |
| Webhooks | NOT APPLICABLE | — |
| Código enviado a Codex | Al cerrar cada épica, el hook envía a Codex (OpenAI, con la cuenta de ChatGPT del usuario) el diff del repositorio: código y datos públicos del CNPO, nunca datos de personas (el proyecto no tiene) | `scripts/codex-revision-etapa.mjs` |
| Auditoría de dependencias | `npm audit --omit=dev` antes del Demo Day; vulnerabilidades altas se corrigen subiendo la versión en el blueprint, no a mano | lista de lanzamiento (§20.1) |
| Cabeceras de seguridad | `X-Content-Type-Options: nosniff`; `X-Frame-Options: DENY`; `Referrer-Policy: strict-origin-when-cross-origin`; `Permissions-Policy: camera=(), microphone=(), geolocation=()`; `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'` | `public/_headers` (paso 15) |
| Datos personales | No se guarda, envía ni registra nada de lo que escribe la persona (sin `fetch`, `localStorage`, cookies ni analítica; verificado en `e2e/entrevista.spec.ts`) | `src/components/islas/Entrevista.tsx` |
| Higiene de logs | La isla no hace `console.log` de lo escrito | `src/components/islas/Entrevista.tsx` |

**Reglas duras**
- Ningún secreto se versiona ni se imprime. Todo lo que llega al navegador es público.
- `npm run deploy`, `npx wrangler login` y `git push` están denegados al agente en `.claude/settings.json`.
- `script-src 'unsafe-inline'` es necesario porque Astro hidrata la isla con un script en línea; es aceptable en un sitio sin datos de usuario ni sesiones.

**Datos regulados:** el proyecto no trata datos personales en el sentido de la Ley N° 29733 de Protección de Datos Personales del Perú, porque no recoge, guarda ni transmite información de las personas. Si un piloto futuro guardara relatos o identidades, esa ley aplicaría y sería un cambio de alcance (no-objetivo de §1).

---

## 15. Accessibility

**Meta: WCAG 2.2 nivel AA.** Para un prototipo presentado a una entidad pública peruana y pensado para personas con celulares de gama baja, es parte del producto, no un pulido.

### Baseline requirements

| Requisito | Regla |
|---|---|
| HTML semántico | `header`/`nav`/`main`/`footer`; un `h1` por página; encabezados en orden; listas para listas (rankings, competencias) |
| Teclado | Todo se usa con teclado; enlace `Saltar al contenido` como primer elemento enfocable (probado en el paso 2) |
| Foco visible | Contorno de 3px `#0B5CAD` (6,67:1 sobre blanco); en la barra roja, contorno blanco (`focus-visible:outline-fondo`, 6,23:1) |
| Contraste | Texto ≥ 4,5:1 — la paleta de §7 lo cumple en todos los pares |
| Formularios | Cada `textarea` con `<label htmlFor>`; el error es texto en `role="alert"`, no solo color |
| Imágenes | No hay imágenes en v1; la barra de cobertura es decorativa (`aria-hidden`) y su porcentaje está en texto |
| Movimiento | Sin animaciones |
| Zoom / reflujo | Sin scroll horizontal a 360 px (probado) y usable a 200 % de zoom |
| Regiones vivas | Los resultados de la entrevista en `aria-live="polite"` |
| Color no es la única señal | Cada chip dice "Ya lo tienes" o "Por fortalecer"; cada insignia dice "Demanda referencial: …" |

### WCAG 2.2 additions — the ones most often missed

| SC | Requisito |
|---|---|
| 2.4.11 Foco no oculto (mínimo) | No hay encabezados fijos, barras de cookies ni avisos flotantes: el aviso de prototipo es parte del flujo |
| 2.5.7 Movimientos de arrastre | No hay interacciones de arrastre |
| 2.5.8 Tamaño del objetivo (mínimo) | Botones de 48px de alto; enlaces de navegación con separación de 16px |
| 3.3.7 Entrada redundante | La entrevista no pide repetir información |
| 3.3.8 Autenticación accesible (mínimo) | NOT APPLICABLE — sin autenticación |

### Verification

```bash
npx playwright test e2e/accesibilidad.spec.ts   # expect: exit 0 — 0 violaciones critical/serious (wcag2a, wcag2aa) y scrollWidth ≤ 360 en 5 páginas
```

Las comprobaciones automáticas encuentran alrededor de un tercio de los problemas reales. Antes del Demo Day: recorrido solo con teclado de portada → transición → entrevista, una pasada con lector de pantalla (NVDA o TalkBack) sobre una transición, y una pasada a 200 % de zoom en 360 px (§20.1).

---

## 16. Observability & Cost

### Instrumentation

| Señal | Herramienta | Qué captura | Quién la mira |
|---|---|---|---|
| Errores | `npm run build` (falla con `Datos inconsistentes: …` si los datos no cuadran) | Errores de datos y de tipos antes de publicar | El equipo, al publicar |
| Logs | Historial de despliegues de Cloudflare Pages | Qué versión está publicada y cuándo | El equipo |
| Métricas | Ninguna en v1, por la promesa de privacidad | — | — |
| Uptime | Comprobación manual de la URL el día del Demo Day | Que `*.pages.dev` responda 200 | El equipo, el 29 y 30-oct |

### The metrics that matter for this project

| Métrica | Meta | Alerta en |
|---|---|---|
| Puerta de §20.1 en verde | 100 % de las líneas con exit 0 antes de cada publicación | cualquier línea distinta de 0 |
| Violaciones axe serias/críticas | 0 | ≥ 1 |
| Enlaces de cursos que responden | 1 de 1 (`npm run verificar-enlaces`) | exit 1 |
| Tiempo de `npm run build` | < 2 minutos | > 5 minutos (señal de que el dataset creció demasiado) |

### Health check

NOT APPLICABLE como endpoint — no hay servidor. La "salud" es: la URL publicada responde 200 y muestra el aviso de prototipo; se comprueba a mano en la lista de lanzamiento.

### Cost model

| Servicio | Capa gratuita | Costo en v1 | Costo a 10× | Límite a vigilar |
|---|---|---|---|---|
| Cloudflare Pages | Plan Free: $0, uso comercial permitido; límites en https://developers.cloudflare.com/pages/platform/limits/ | $0 | $0 | El límite de archivos por despliegue del plan Free: este sitio genera menos de 100 archivos HTML más sus recursos |
| Capacíta-T (MTPE) | Portal público gratuito | $0 | $0 | Que el portal cambie de URL (lo detecta `npm run verificar-enlaces`) |

**Costo mensual estimado al lanzar: $0.** No hay servicios que crezcan con el uso: el sitio es estático y no llama a ninguna API.

---

## 17. Model Routing

NOT APPLICABLE — this project does not call an LLM at runtime.

---

## 18. Skills to Use During Build

Ninguna es obligatoria: si una skill no está instalada, el constructor sigue con lo que dice este blueprint, lo anota en una línea y continúa. Sin barra significa que se activa sola; con barra, que es un comando.

| Skill | Pasos de §9 | Por qué | Instalación |
|---|---|---|---|
| frontend-design | 8, 9, 10, 11, 13, 14 | Maquetación de las páginas y de la isla dentro de los tokens de §7 | `/plugin marketplace add anthropics/skills` y luego `/plugin install example-skills@anthropic-agent-skills` |
| playwright-cli | 1, 2, 8, 9, 10, 11, 13, 14 | Escribir y depurar las pruebas E2E | `npm install -g @playwright/cli@latest` y luego `playwright-cli install --skills` |
| ui-ux-pro-max | 8, 9, 10, 11 (pasada visual opcional) | Revisar jerarquía y ritmo visual sin cambiar los tokens de §7 | `/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill` y luego `/plugin install ui-ux-pro-max@ui-ux-pro-max-skill` |
| `/humanizalo` | 8, 11, 13, 14 | Pulir los textos en español para que suenen naturales (los textos fijos que prueban los E2E no se cambian) | `git clone https://github.com/Hainrixz/humanizalo.git ~/.claude/skills/humanizalo` (el registro lo marca como sin actualizaciones desde 2026-03-22: revisa el repositorio antes de instalar) |

**Stitch (Google)** no es una skill ni una dependencia: si una persona guarda capturas en `docs/referencias/*.png`, el constructor puede mirarlas como referencia de disposición; los tokens de §7 siempre ganan y nunca se pega código de Stitch.

**Skills del propio proyecto** (§19.4, ya instaladas por la copia de `workspace/`): `verificar-todo` y `agregar-ocupacion`.

---

## 19. Agent Workspace

El proyecto trae su propia configuración de agente y todos los archivos de configuración que necesitan las puertas de §9. En este bundle son **archivos reales** bajo `blueprints/reconversion-laboral/workspace/`, que replica la estructura de la raíz del proyecto:

```
blueprints/reconversion-laboral/workspace/
├── CLAUDE.md                    # §19.1
├── AGENTS.md                    # §19.2
├── package.json                 # §19.6 — manifiesto completo (origen 2: no hay scaffolder)
├── .nvmrc                       # §19.6
├── .gitignore                   # §19.6 — llega antes del primer commit
├── .gitattributes               # §19.6 — LF en todo el repositorio; PDF y PNG binarios
├── astro.config.mjs             # §19.6
├── tsconfig.json                # §19.6
├── biome.json                   # §19.6
├── vitest.config.ts             # §19.6
├── playwright.config.ts         # §19.6
├── scripts/codex-revision-etapa.mjs   # §19.6 — hook de revisión de Codex por épica
└── .claude/
    ├── settings.json            # §19.3
    ├── agents/constructor.md    # §19.4 — subagente constructor
    ├── skills/agregar-ocupacion/SKILL.md   # §19.4
    ├── skills/verificar-todo/SKILL.md      # §19.4
    ├── rules/datos.md           # §19.5
    └── rules/ui.md              # §19.5
```

**El constructor copia este directorio, completo, a la raíz del proyecto como primera acción del Bootstrap de §10**, con `cp -R blueprints/reconversion-laboral/workspace/. .`, en vez de elegir archivos uno por uno. Nada más del bundle se copia.

**La copia es segura de repetir** (forma "copiar y re-derivar"): ningún paso de §9 edita un archivo de `workspace/` (regla 4 de "No negociable" en `CLAUDE.md`), así que sobrescribirlos los deja idénticos; `package-lock.json` no está en `workspace/` y nunca se sobrescribe; y las líneas siguientes del Bootstrap re-derivan lo que depende de la copia (`npm install` reinstala desde el mismo manifiesto y el mismo lockfile, `npx biome check --write .` vuelve a aplicar el formato). La guarda no puede fallar en su propio camino: `cp -R` de GNU (el de Git Bash) termina con 0 al sobrescribir. Archivos que nunca se sobrescriben: `package-lock.json` y todo lo que crean los pasos de §9.

**Los archivos emitidos pasan las puertas del propio blueprint:** están escritos con el estilo de `biome.json` (espacios, ancho 2, comillas dobles, línea de 100, LF) y Biome no procesa Markdown (`!**/*.md`). Verificado el 2026-10-26: sobre una copia recién hecha de `workspace/`, `npx biome check --write .` reporta `No fixes applied` en la primera y en la segunda ejecución.

**`.claude/commands/` no se emite.** Los flujos repetibles son skills (§19.4).

### 19.1 `CLAUDE.md`

Archivo real: `workspace/CLAUDE.md` (idéntico byte a byte).

````markdown
# Reconversión Laboral — prototipo

Sitio estático (Astro + islas React) donde un trabajador elige su ocupación y ve a qué ocupaciones afines puede pasar, qué competencias ya tiene y cuáles debe fortalecer, con sustento en el Catálogo Nacional de Perfiles Ocupacionales (CNPO) del MTPE. Prototipo para el jurado del Demo Day del Innovathon Ulima x Tether (30-oct-2026).

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

Astro (salida estática) · TypeScript · islas React solo con interacción · Tailwind CSS 4 (CSS-first, `@theme`) · zod · Vitest · Playwright + axe · Biome · npm · Cloudflare Pages (subida directa con wrangler).

## Arquitectura

**Camino de un dato.** PDF del CNPO (`fuentes/perfiles/`) → `scripts/extraer-texto.mjs` → `fuentes/texto/*.txt` → el equipo/constructor redacta `src/data/*.json` citando ids de elemento → `src/lib/datos.ts` valida todo con los esquemas de `src/lib/esquemas.ts` al construir → `src/lib/afinidad.ts` calcula transiciones → las páginas `src/pages/**` generan HTML estático en `dist/`.

**Camino de la entrevista.** `src/pages/entrevista.astro` pasa datos mínimos como props a la isla `src/components/islas/Entrevista.tsx` (`client:load`) → `src/lib/traductor/palabras-clave.ts` detecta competencias → `src/lib/sugerencias.ts` sugiere 3 ocupaciones. Nada se guarda ni se envía: sin `fetch`, sin `localStorage`.

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
| Traductor de relatos | `src/lib/traductor/tipos.ts` (contrato) + `palabras-clave.ts` (implementación) |
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
| `primario` / `primario-oscuro` | `#C1121F` / `#8E0E18` | Barra superior, botón principal / su hover |
| `texto` / `texto-suave` | `#1F2933` / `#52606D` | Texto / textos secundarios |
| `fondo` / `superficie` / `borde` | `#FFFFFF` / `#F4F6F8` / `#D9DEE3` | Página / tarjetas y pie / bordes de 1px |
| `enlace` / `foco` | `#0B5CAD` / `#0B5CAD` | Enlaces / contorno de foco de 3px |
| `ya-tienes-texto` / `ya-tienes-fondo` | `#1E7B3A` / `#E6F4EA` | Competencias que ya tiene |
| `por-fortalecer-texto` / `por-fortalecer-fondo` | `#B54708` / `#FEF0E1` | Competencias por fortalecer |
| `aviso-texto` / `aviso-fondo` | `#5C4813` / `#FFF8DB` | Aviso de prototipo |
| `referencial-texto` / `referencial-fondo` | `#3E4C59` / `#E4E7EB` | Insignia "Demanda referencial" |

- **Letra:** `system-ui, "Segoe UI", Roboto, Arial, sans-serif`; sin fuentes web ni peticiones externas. Base 18px / 1.6; h1 2rem 700, h2 1.5rem 700, h3 1.25rem 600.
- **Espaciado:** escala de 4px de Tailwind. **Radio:** 8px (`rounded-base`). **Sombras:** ninguna, solo bordes de 1px.
- **Botones:** `min-h-12` (48px), ancho completo en móvil (`w-full sm:w-auto`).
- **Diseño:** móvil primero (360px), ancho máximo `max-w-contenido` (72rem), sin scroll horizontal a 360px.
- **Color nunca es la única señal:** cada chip lleva su texto ("Ya lo tienes" / "Por fortalecer").
- **Sin animaciones.** Sin logos, escudos ni marcas de gob.pe: solo el logotipo de texto "Reconversión Laboral".
- **Stitch (Google) es solo referencia visual opcional:** si existen `docs/referencias/*.png` puedes mirarlas para la disposición; los tokens de esta tabla siempre ganan y nunca se pega código de Stitch.

## Entorno

| Variable | Requerida | Usada por | Origen |
|---|---|---|---|
| `PERFILES_ORIGEN` | no | `scripts/copiar-perfiles.mjs` | Carpeta con los PDF del CNPO; por defecto `C:/Users/Home/Pictures/TETHER/innova/perfiles - copia` |
| `CLAUDE_PROJECT_DIR` | no | `scripts/codex-revision-etapa.mjs` | La define Claude Code al ejecutar hooks; si falta, se usa el directorio actual |

No hay archivo `.env`, ni secretos, ni claves de API. La sesión de wrangler la crea una persona con `npx wrangler login`.

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
2. **Nunca guardes ni envíes datos del usuario:** sin `fetch`, sin `localStorage`/`sessionStorage`, sin analítica, sin formularios que salgan del navegador.
3. **El aviso "Prototipo para el Innovathon Ulima x Tether. No es un sitio oficial del Estado peruano." aparece en todas las páginas** y no se usa ningún logo oficial.
4. **No edites los archivos que trajo `workspace/`** (`package.json`, `tsconfig.json`, `biome.json`, `astro.config.mjs`, `vitest.config.ts`, `playwright.config.ts`, `.gitignore`, `.nvmrc`, `scripts/codex-revision-etapa.mjs`, `.claude/**`, este archivo). Si parecen estar mal, detente y repórtalo.
5. **Nunca ejecutes `npm run deploy`, `npx wrangler login` ni `git push`.** Publicar es un paso humano.
6. **Nunca edites un comando `verify` ni marques una tarea como hecha con una puerta en rojo.**
7. Nunca subas `node_modules/`, `dist/`, `.astro/` ni archivos `.env`.
````

### 19.2 `AGENTS.md`

Archivo real: `workspace/AGENTS.md` (idéntico byte a byte).

````markdown
# Reconversión Laboral — instrucciones para agentes

Sitio estático (Astro + islas React) que orienta a un trabajador sobre ocupaciones afines según el CNPO del MTPE. Prototipo para el Innovathon Ulima x Tether; sin servidor, sin login, sin base de datos.

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
2. Nunca guardes ni envíes datos del usuario (sin `fetch`, sin `localStorage`, sin analítica).
3. El aviso "Prototipo para el Innovathon Ulima x Tether. No es un sitio oficial del Estado peruano." aparece en todas las páginas; sin logos oficiales.
4. No edites los archivos copiados de `workspace/` (configs, `package.json`, `scripts/codex-revision-etapa.mjs`, `.claude/**`, `CLAUDE.md`, este archivo).
5. Nunca ejecutes `npm run deploy`, `npx wrangler login` ni `git push`.
6. Nunca edites un comando `verify` ni marques una tarea como hecha con una puerta en rojo.

Arquitectura completa, límites entre capas y tokens de diseño: `CLAUDE.md` en este mismo directorio.
````

### 19.3 `.claude/settings.json`

Cada comando de los `Verify` de §9, de los Checkpoint, del Bootstrap de §10 y de §20.1, partido en sus subcomandos (`&&`, `||`, `;`, `|`, `$( )`), tiene su entrada exacta en `allow`, salvo los de solo lectura integrados (`ls`, `cat`, `grep`, `wc`, `tail`, `git` de solo lectura). `Bash(test:*)` cubre las puertas con `status=0; … || status=$?; test "$status" -eq N` y los `test -f`/`test -e`. No hay intérpretes sueltos (`node` solo con los tres scripts exactos), ni comodines de `npx` (solo `npx vitest run`, `npx playwright test`, `npx playwright install chromium`, `npx biome check`, `npx astro check`, `npx wrangler --version`), ni herramientas de red. `deny` bloquea publicar, iniciar sesión en Cloudflare y `git push`; recuerda que un `deny` desalienta pero no aísla.

**Hook `PostToolUse`:** después de cada comando Bash, Claude Code ejecuta `node scripts/codex-revision-etapa.mjs` (límite de 900 s). El script sale en silencio salvo cuando el comando creó la etiqueta `paso-NN` de la última tarea de una épica; su contrato completo está en §19.6. Las entradas `Bash(node scripts/codex-revision-etapa.mjs)`, `Bash(git tag -l:*)` y `Bash(git for-each-ref:*)` permiten correrlo a mano. `deny` no cambia.

Archivo real: `workspace/.claude/settings.json` (idéntico byte a byte).

```json
{
  "permissions": {
    "allow": [
      "Bash(command -v node)",
      "Bash(node -v)",
      "Bash(npm -v)",
      "Bash(npm install)",
      "Bash(npm ci)",
      "Bash(npm audit:*)",
      "Bash(npm run build)",
      "Bash(npm run check)",
      "Bash(npm run format)",
      "Bash(npm test)",
      "Bash(npm run test)",
      "Bash(npm run test:e2e)",
      "Bash(npm run dev)",
      "Bash(npm run preview)",
      "Bash(npm run copiar-perfiles)",
      "Bash(npm run extraer)",
      "Bash(npm run verificar-enlaces)",
      "Bash(node scripts/copiar-perfiles.mjs)",
      "Bash(node scripts/extraer-texto.mjs)",
      "Bash(node scripts/verificar-enlaces.mjs)",
      "Bash(node scripts/verificar-enlaces.mjs --solo-listar)",
      "Bash(node scripts/codex-revision-etapa.mjs)",
      "Bash(npx vitest run:*)",
      "Bash(npx playwright test:*)",
      "Bash(npx playwright install chromium)",
      "Bash(npx biome check:*)",
      "Bash(npx astro check)",
      "Bash(npx wrangler --version)",
      "Bash(test:*)",
      "Bash(cp -R blueprints/reconversion-laboral/workspace/. .)",
      "Bash(export PATH=\"/c/Program Files/nodejs:$PATH\")",
      "Bash(git init -b main)",
      "Bash(git rev-parse:*)",
      "Bash(git config user.name:*)",
      "Bash(git config user.email:*)",
      "Bash(git add -A)",
      "Bash(git commit -m:*)",
      "Bash(git tag:*)",
      "Bash(git tag -l:*)",
      "Bash(git tag -f inicio-paso-:*)",
      "Bash(git reset --hard inicio-paso-:*)",
      "Bash(git add docs/revisiones-codex)",
      "Bash(git for-each-ref:*)",
      "Bash(git status:*)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      "Bash(git ls-files:*)",
      "Bash(git check-ignore:*)",
      "Bash(git rev-list:*)"
    ],
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Bash(git push:*)",
      "Bash(npm run deploy)",
      "Bash(npx wrangler login)",
      "Bash(npx wrangler pages deploy:*)",
      "Bash(npx wrangler pages project:*)"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node scripts/codex-revision-etapa.mjs",
            "timeout": 900
          }
        ]
      }
    ]
  }
}
```

### 19.4 Project skills — `.claude/skills/<name>/SKILL.md`

| Skill | Se activa con | Qué automatiza |
|---|---|---|
| `verificar-todo` | "verifica todo", "corre las pruebas", "¿está listo?", antes de marcar un paso como hecho | Formato, `npm run check`, `npm test`, `npm run test:e2e`, `npm run build`, con el código de salida de cada uno |
| `agregar-ocupacion` | "agrega la ocupación X", "suma otro perfil del CNPO" | PDF → texto → `ocupaciones.json` → `mapeo.json` → conteos de pruebas → verificación |

**Subagente `constructor` (`.claude/agents/constructor.md`).** Es quien escribe el código. La sesión principal (que coordina) lo invoca con la herramienta Agent y `subagent_type: "constructor"`, una tarea por invocación, y revisa su informe antes de pasar a la siguiente. Modelo `claude-sonnet-5-5` con `effort: high`; herramientas `Read, Write, Edit, Glob, Grep, Bash`. Usa solo comandos que ya están en la allowlist de §19.3, así que no añade permisos. Pone el `status` de su tarea en `in_progress` al empezar y en `done` antes del Checkpoint (es el único cambio permitido dentro de `blueprints/`). Si después de 2 intentos un `verify` sigue fallando, vuelve con `git reset --hard inicio-paso-NN` e informa sin improvisar. Si aparece el aviso del hook de Codex, corrige los hallazgos altos y medios. **Excepción del paso 5:** el mapeo de competencias lo escribe el constructor, pero la sesión principal revisa la evidencia de `src/data/mapeo.json` contra `fuentes/texto/` antes de empezar el paso 6. Como Biome excluye `**/*.md`, el archivo no necesita formato.

Archivo real: `workspace/.claude/agents/constructor.md` (idéntico byte a byte).

````markdown
---
name: constructor
description: Construye UNA tarea del plan reconversion-laboral por invocación — lee tasks.json, toma la primera tarea pending cuyas dependencias estén done, implementa exactamente lo que dice su paso en blueprints/reconversion-laboral/blueprint.md, corre su Verify y su Checkpoint. Úsalo para escribir el código de cada paso; no diseña ni cambia el plan.
tools: Read, Write, Edit, Glob, Grep, Bash
model: claude-sonnet-5-5
effort: high
---

# Constructor

Escribes el código de **una sola tarea** por invocación. No diseñas, no cambias el plan, no improvisas.

## Antes de empezar
1. Si `node -v` falla en Git Bash: `export PATH="/c/Program Files/nodejs:$PATH"`.
2. Lee `blueprints/reconversion-laboral/tasks.json`. Elige la **primera** tarea con `status: "pending"` cuyas `dependencies` estén todas en `done`, en el orden del arreglo. Si hay una tarea en `in_progress`, resuélvela primero: corre su `verify`; si todo sale 0, pásala a `done` y haz su Checkpoint; si no, termina esa tarea. Si una tarea está `done` pero `git tag -l paso-NN` no la lista, ejecuta su Checkpoint antes de elegir otra.
3. Cambia su `status` a `"in_progress"` en `tasks.json` (solo ese campo).
4. Ejecuta `git tag -f inicio-paso-NN` (NN = el número de su `checkpoint`, por ejemplo `paso-07` → `inicio-paso-07`).
5. Lee el paso en `blueprints/reconversion-laboral/blueprint.md` §9 (o el bloque de la tarea en `blueprints/reconversion-laboral/epics/<epic>.md`, que trae el mismo contenido) y `CLAUDE.md`.

## Construir
- Implementa **solo** el **Do** de ese paso, con el contenido literal del blueprint. Crea únicamente los archivos de su lista `files`.
- Nunca edites los archivos que trajo `workspace/` (lista de la regla 4 de "No negociable" en `CLAUDE.md`), ni los tests o comandos `verify` de pasos anteriores para que pasen, ni nada dentro de `blueprints/` salvo el campo `status` de `tasks.json`.
- Ejecuta `npm run format`.

## Verificar
- Corre cada línea del bloque **Verify** de la tarea (el arreglo `verify` de `tasks.json`), **una por una, en orden**, y detente en la primera que no termine con 0.
- Si una falla: corrige el código y vuelve a correr **todo** el bloque. Tienes **2 intentos** de corrección.
- Si después de 2 intentos sigue fallando: `git reset --hard inicio-paso-NN`, deja la tarea en `"pending"` y termina con un informe: tarea, paso, comando que falló, código de salida y las últimas ~20 líneas de su salida. No inventes soluciones fuera del paso.

## Cerrar
1. Cambia el `status` de la tarea a `"done"` en `tasks.json` (así el commit del Checkpoint lo incluye).
2. Ejecuta la línea **Checkpoint** exactamente como está escrita: `git add -A && git commit -m "paso NN: … (EX-TY)" && git tag paso-NN`.
3. Si tras ese comando aparece el aviso del hook de Codex (la etapa se cerró), lee `docs/revisiones-codex/etapa-<epic>.md` y corrige los hallazgos de severidad alta o media en un commit `codex: correcciones etapa <epic>`, con `npm run check` en verde (y `npm test` a partir del paso 3). Si un hallazgo contradice el blueprint, no lo corrijas: anótalo en tu informe. Si el aviso dice que la revisión falló, solo menciónalo.

## Informe final (corto)
- Id de la tarea y número de paso.
- Archivos creados o editados.
- Resultado de cada línea de `verify` (código de salida).
- Etiqueta creada (`paso-NN`) y, si hubo, el commit de correcciones de Codex y los hallazgos anotados.

## Nunca
- Más de una tarea por invocación.
- `npm run deploy`, `npx wrangler login`, `git push`, `git reset --hard paso-NN`.
- Datos del CNPO que no estén en `fuentes/texto/`.
````

`.claude/skills/verificar-todo/SKILL.md`:

Archivo real: `workspace/.claude/skills/verificar-todo/SKILL.md` (idéntico byte a byte).

````markdown
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
````

`.claude/skills/agregar-ocupacion/SKILL.md`:

Archivo real: `workspace/.claude/skills/agregar-ocupacion/SKILL.md` (idéntico byte a byte).

````markdown
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
````

### 19.5 `.claude/rules/*.md`

| Archivo | Globs de `paths` | Cubre |
|---|---|---|
| `.claude/rules/datos.md` | `src/data/**`, `fuentes/**`, `scripts/**`, `src/lib/esquemas.ts`, `src/lib/integridad.ts` | Evidencia obligatoria, ids de elemento, rol supervisor/operativo, palabras clave, URL de cursos |
| `.claude/rules/ui.md` | `src/pages/**`, `src/components/**`, `src/layouts/**`, `src/styles/**` | Tokens, etiquetas de texto en chips, móvil primero, islas, accesibilidad, sin logos |

`.claude/rules/datos.md`:

Archivo real: `workspace/.claude/rules/datos.md` (idéntico byte a byte).

````markdown
---
description: Datos del CNPO, competencias, mapeo, cursos y scripts de extracción
paths:
  - "src/data/**"
  - "fuentes/**"
  - "scripts/**"
  - "src/lib/esquemas.ts"
  - "src/lib/integridad.ts"
---

# Datos

- La única fuente de verdad son los 9 PDF de `fuentes/perfiles/` y su texto en `fuentes/texto/`. Si un dato no está ahí, no existe.
- Ids de elemento: `<codigoEstandar>-E<n>`, por ejemplo `H2452001-1-E1` = estándar `H2452001-1`, "Elemento de Competencia 1".
- Un estándar es `supervisor` si su descripción empieza con Supervisar, Organizar, Coordinar, Planificar o Gestionar, o nombra el puesto de supervisor; si no, `operativo`. Solo los `operativo` se citan en `mapeo.json`.
- Una competencia se mapea a una ocupación solo si al menos un elemento operativo (su texto, sus criterios de desempeño o sus conocimientos) la involucra de forma explícita. Cita todos esos ids.
- Cada ocupación termina con entre 6 y 16 competencias, al menos 4 técnicas. Las transversales (`C26`–`C30`) pueden salir de criterios o actitudes de elementos operativos.
- `palabrasClave`: minúsculas, sin tildes ni eñes (`ninos`, `companeros`), palabras o frases separadas por un espacio.
- `cursos.json`: una entrada por competencia, `url` siempre `https://capacitacionlaboral.trabajo.gob.pe/`, `horasReferenciales` entero entre 4 y 10. Nunca inventes URLs profundas de cursos.
- `demanda.nivel` es ilustrativo (decisión del equipo, no oficial) y `tipo` siempre es `"referencial"`.
- Compras (`H2452004`) está fuera: su PDF es escaneado y no tiene texto.
- Los scripts de `scripts/` usan solo `node:*` y `pdfjs-dist`; nunca importan de `src/`.
- Después de editar un JSON: `npm run format`, luego `npx vitest run tests/integridad.test.ts`.
````

`.claude/rules/ui.md`:

Archivo real: `workspace/.claude/rules/ui.md` (idéntico byte a byte).

````markdown
---
description: Páginas, componentes, layout y estilos
paths:
  - "src/pages/**"
  - "src/components/**"
  - "src/layouts/**"
  - "src/styles/**"
---

# Interfaz

- Toda página usa `src/layouts/Base.astro` con `titulo` y `descripcion` propios; el `<title>` queda "<titulo> | Reconversión Laboral" y es único por página.
- Un solo `h1` por página; encabezados en orden (h1 → h2 → h3).
- Solo tokens de `src/styles/global.css`: `bg-primario`, `text-texto`, `text-texto-suave`, `bg-superficie`, `border-borde`, `text-enlace`, `bg-ya-tienes-fondo`, `text-ya-tienes-texto`, `bg-por-fortalecer-fondo`, `text-por-fortalecer-texto`, `bg-aviso-fondo`, `text-aviso-texto`, `bg-referencial-fondo`, `text-referencial-texto`. Ningún hex suelto ni color de la paleta por defecto de Tailwind.
- El color nunca es la única señal: cada chip muestra "Ya lo tienes" o "Por fortalecer" como texto, y cada insignia dice "Demanda referencial: Alta|Media|Baja".
- Móvil primero: diseña a 360px; contenedores `mx-auto max-w-contenido px-4`; textos largos (ids de elemento) con `break-words`. Nada puede producir scroll horizontal a 360px.
- Botones y enlaces con aspecto de botón: `min-h-12` (48px), `w-full sm:w-auto`, `rounded-base`.
- Enlaces dentro de la barra roja usan `text-fondo` y `focus-visible:outline-fondo` para que el foco se vea sobre el rojo.
- Islas React solo con interacción, con `client:load`; hoy solo `src/components/islas/Entrevista.tsx`. Una página sin isla no lleva `<script>`.
- En React: `<label htmlFor>` en cada campo, errores en un elemento `role="alert"`, resultados en una región `aria-live="polite"`, botones con `type`.
- Sin logos, escudos, banderas ni recursos de gob.pe. Sin imágenes en v1.
- Textos en español del Perú, trato de "tú". Nunca digas que la herramienta evalúa o certifica: es una orientación preliminar.
- Stitch (Google) es solo referencia visual opcional (`docs/referencias/*.png`); estos tokens ganan y nunca se pega su código.
````

### 19.6 Verify-critical config and local infrastructure

**Quién escribe el manifiesto:** ningún comando del Bootstrap genera `package.json` (no se usa `npm create astro`), así que **lo escribe este blueprint** (origen 2): `workspace/package.json`, completo, con versiones exactas. Ningún paso de §9 lo escribe ni lo edita. Lo mismo para `.nvmrc`, `.gitignore` y las configuraciones de compilador, lint y pruebas, que el Bootstrap y la primera puerta leen antes del paso 1.

**Servicios locales:** ninguno. Ningún `Verify` necesita base de datos, caché ni cola; el único "servicio" es el sitio estático, que `playwright.config.ts` construye y sirve con `npm run build && npm run preview`.

**Archivos de prueba y fixtures:** los escribe el paso que los ejecuta (están en la lista **Do** y en `files` de su tarea). No hay archivos de salida esperada byte a byte emitidos aquí.

| Archivo | Ruta en el proyecto | Qué comandos `Verify` lo necesitan | Resolución / entorno que lleva | Exclusión de la ruta del bundle |
|---|---|---|---|---|
| `package.json` | `package.json` | todos (scripts `build`, `check`, `test`, `copiar-perfiles`, `extraer`, `preview` que usa Playwright) | `"type": "module"` para que `scripts/*.mjs` y las configs sean ESM; ninguna herramienta lee variables de entorno | `n/a — no recorre el árbol` |
| `.nvmrc` | `.nvmrc` | ninguno directamente; fija Node 24 | ninguna | `n/a — no recorre el árbol` |
| `.gitignore` | `.gitignore` | Checkpoints de todos los pasos (`git add -A`) | ninguna | no excluye `blueprints/` a propósito: el bundle se versiona (§10) |
| `.gitattributes` | `.gitattributes` | `npm run check` (`biome check .`) después de cualquier `git clone`, `git checkout` o `git reset --hard inicio-paso-NN` | `* text=auto eol=lf`; `*.pdf binary`; `*.png binary`. Verificado el 2026-10-26 con `core.autocrlf=true`: con el archivo, un clon queda en LF y `biome check` pasa; sin él, el clon queda en CRLF; el PDF queda idéntico byte a byte | `n/a — git no recorre el bundle de forma distinta` |
| `astro.config.mjs` | `astro.config.mjs` | `npm run build`, `npm run check`, toda E2E | `output: "static"`, `outDir: "./dist"`, `integrations: [react()]`, `vite.plugins: [tailwindcss()]`; Astro solo procesa `src/` | Astro solo lee `src/` y `public/`, pero el plugin `@tailwindcss/vite` que carga busca clases en todo el proyecto: la exclusión está en `src/styles/global.css` (fila siguiente) |
| `global.css` (Tailwind) | `src/styles/global.css` — lo escribe el paso 1, no viene en `workspace/` | `npm run build` y toda E2E (pasos 1, 2, 8–11, 13, 14) | `@import "tailwindcss";` y los tokens `@theme`; sin variables de entorno | `@source not "../../blueprints";` y `@source not "../../fuentes";` justo después del `@import` (rutas relativas al archivo). Verificado con Tailwind 4.3.3 el 2026-10-24: una clase que solo existe en `blueprints/` no se genera |
| `tsconfig.json` | `tsconfig.json` | `npm run check` (astro check) en todos los pasos | `extends: "astro/tsconfigs/strict"`, `allowImportingTsExtensions: true`, `noEmit: true`, `resolveJsonModule: true`, `jsx: "react-jsx"`, `jsxImportSource: "react"` | `"exclude": ["dist", "blueprints", "fuentes", "node_modules"]` |
| `biome.json` | `biome.json` | `npm run check` y el Bootstrap (`npx biome check .`) | `css.parser.tailwindDirectives: true` (para `@theme`); override para `**/*.astro` que apaga `noUnusedVariables`, `noUnusedImports`, `useConst`, `useImportType` (Biome solo ve el frontmatter); no lee variables de entorno | `"!!**/blueprints"` en `files.includes` (exclusión forzada: el `biome.json` anidado en `workspace/` nunca se escanea). También `"!**/*.md"`: Biome 2.6 formatea Markdown y reescribiría `CLAUDE.md`, las reglas, las skills y los informes de Codex (que nadie debe editar) |
| `vitest.config.ts` | `vitest.config.ts` | `npx vitest run …` y `npm test` desde el paso 3 | `include: ["tests/**/*.test.ts"]`; los `.ts` y `.json` los resuelve el resolvedor de Vite sin alias; `environment: "node"`; `passWithNoTests: false` para que un archivo inexistente haga fallar la puerta; no lee variables de entorno | `exclude: ["blueprints/**", …]` |
| `codex-revision-etapa.mjs` | `scripts/codex-revision-etapa.mjs` | ninguno: lo ejecuta el hook `PostToolUse` de `.claude/settings.json` después de cada Checkpoint; no es una puerta | ESM (`"type": "module"`), solo `node:*`; lee `CLAUDE_PROJECT_DIR` (lo define Claude Code al correr hooks) con `process.cwd()` como respaldo; no importa nada de `src/`. Pasa `biome check`; `astro check` no lo revisa (`.mjs` sin `allowJs`) | lee `blueprints/reconversion-laboral/tasks.json` a propósito; no recorre el árbol |
| `playwright.config.ts` | `playwright.config.ts` | `npx playwright test …` en los pasos 1, 2, 8–11, 13, 14 | `testDir: "e2e"`, `webServer.command: "npm run build && npm run preview"`, `url`/`baseURL` `http://127.0.0.1:4321`, `reuseExistingServer: false`, `timeout: 180000`, proyectos `chromium` y `movil` (360×740), `reporter: "list"` (nunca abre un servidor de reportes que bloquee); no lee variables de entorno | `testIgnore: ["**/blueprints/**"]` |

**Revisión de Codex al cerrar cada épica (`scripts/codex-revision-etapa.mjs`).** Contrato:

1. Lee por stdin el JSON del hook. Si `tool_input.command` no contiene `git tag paso-NN` (expresión `/git tag (paso-\d{2})/`), termina con 0 sin imprimir nada.
2. Busca en `blueprints/reconversion-laboral/tasks.json` la tarea cuyo `checkpoint` es esa etiqueta y su `epic`. La etapa está **cerrada** solo si todas las tareas de esa épica tienen su etiqueta en git (`git tag -l`). Si no está cerrada, o si ya existe `codex-etapa-<epic>`, termina con 0 en silencio.
3. Base de la revisión: la etiqueta `codex-etapa-*` más reciente por fecha de creación (`git for-each-ref --sort=-creatordate refs/tags/codex-etapa-*`) o, si no hay, el commit raíz (`git rev-list --max-parents=0 HEAD`), que es el commit del Bootstrap.
4. Ubica `codex-companion.mjs` en la versión más alta de `~/.claude/plugins/cache/openai-codex/codex/<versión>/scripts/` y ejecuta `node <companion> review --wait --base <base> --scope branch --cwd <raíz>` con `spawnSync` y un límite de 840 000 ms.
5. Escribe `docs/revisiones-codex/etapa-<epic>.md` con etapa, base, fecha ISO, comando, resultado y la salida íntegra (stdout y stderr). Si la revisión salió bien, crea `git tag codex-etapa-<epic>` en `HEAD` e imprime un `additionalContext` que obliga a leer el informe y corregir los hallazgos altos y medios en un commit `codex: correcciones etapa <epic>` antes de la siguiente etapa.
6. **Nunca bloquea:** sin plugin, sin sesión de Codex, cuota agotada, tiempo agotado o código distinto de 0 → escribe igual el informe con el error, **no** crea la etiqueta, imprime un `additionalContext` que dice que la revisión falló y que una persona puede correr `/codex:review`, y termina con 0. Si el `.md` de esa épica ya existe, se sobrescribe.

Verificado en esta máquina (2026-10-24, Node 24.22.1, repositorio temporal y un plugin falso): sin etiqueta de paso → silencio y 0; épica abierta → silencio y 0; épica cerrada sin plugin → informe con `FALLÓ`, sin etiqueta, 0; con dos versiones del plugin elige la mayor (1.0.10 sobre 1.0.6), escribe el informe y crea `codex-etapa-01-base`; repetido → silencio; la épica siguiente usa `codex-etapa-01-base` como base; stdin vacío → 0. `biome check` pasa con el `biome.json` emitido.

**Contenido completo de cada archivo** (idéntico byte a byte a los archivos de `workspace/`):

`workspace/package.json`:

```json
{
  "name": "reconversion-laboral",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=24.0.0"
  },
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview --host 127.0.0.1 --port 4321",
    "check": "astro check && biome check .",
    "format": "biome check --write .",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "copiar-perfiles": "node scripts/copiar-perfiles.mjs",
    "extraer": "node scripts/extraer-texto.mjs",
    "verificar-enlaces": "node scripts/verificar-enlaces.mjs",
    "deploy": "npm run build && wrangler pages deploy dist --project-name=reconversion-laboral --branch=main"
  },
  "dependencies": {
    "@astrojs/react": "7.1.1",
    "@tailwindcss/vite": "4.3.3",
    "astro": "7.1.1",
    "react": "19.3.1",
    "react-dom": "19.3.1",
    "tailwindcss": "4.3.3",
    "zod": "4.6.7"
  },
  "devDependencies": {
    "@astrojs/check": "0.9.12",
    "@axe-core/playwright": "4.14.0",
    "@biomejs/biome": "2.6.3",
    "@playwright/test": "1.64.1",
    "@types/node": "24.19.2",
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
    "pdfjs-dist": "6.4.299",
    "typescript": "6.0.3",
    "vitest": "5.0.5",
    "wrangler": "4.152.0"
  }
}
```

`workspace/.nvmrc`:

```text
24
```

`workspace/.gitignore`:

```text
# Dependencias y salidas generadas: nunca se versionan
node_modules/
dist/
.astro/
test-results/
playwright-report/
.wrangler/

# Este proyecto no usa archivos .env; si alguien crea uno, no se sube
.env
.env.*
```

`workspace/.gitattributes`:

```text
# Fin de línea LF en todo el repositorio, aunque Git tenga core.autocrlf=true (Biome exige LF).
* text=auto eol=lf
*.pdf binary
*.png binary
```

`workspace/astro.config.mjs`:

```js
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// Sitio 100 % estático: sin adaptador, sin servidor. React solo en islas (client:load).
export default defineConfig({
  output: "static",
  outDir: "./dist",
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
  build: {
    format: "directory",
  },
  trailingSlash: "ignore",
});
```

`workspace/tsconfig.json`:

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist", "blueprints", "fuentes", "node_modules"],
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "resolveJsonModule": true
  }
}
```

`workspace/biome.json`:

```json
{
  "$schema": "https://biomejs.dev/schemas/2.6.3/schema.json",
  "files": {
    "includes": [
      "**",
      "!!**/blueprints",
      "!!**/dist",
      "!!**/.astro",
      "!!**/node_modules",
      "!!**/fuentes",
      "!!**/test-results",
      "!!**/playwright-report",
      "!!**/.wrangler",
      "!**/package-lock.json",
      "!**/*.md"
    ]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "css": {
    "parser": {
      "tailwindDirectives": true
    }
  },
  "linter": {
    "enabled": true
  },
  "overrides": [
    {
      "includes": ["**/*.astro"],
      "linter": {
        "rules": {
          "correctness": {
            "noUnusedVariables": "off",
            "noUnusedImports": "off"
          },
          "style": {
            "useConst": "off",
            "useImportType": "off"
          }
        }
      }
    }
  ]
}
```

`workspace/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

// Solo pruebas unitarias en tests/. Los E2E (e2e/) son de Playwright y la carpeta
// blueprints/ (el plano del proyecto) nunca se recorre.
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    exclude: ["blueprints/**", "node_modules/**", "dist/**", "e2e/**"],
    environment: "node",
    passWithNoTests: false,
  },
});
```

`workspace/playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

// Playwright construye el sitio y lo sirve con `astro preview` en 127.0.0.1:4321.
// Reporter "list": nunca abre un servidor de reportes que bloquee una ejecución desatendida.
export default defineConfig({
  testDir: "e2e",
  testIgnore: ["**/blueprints/**"],
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4321",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    {
      name: "movil",
      use: { ...devices["Desktop Chrome"], viewport: { width: 360, height: 740 } },
    },
  ],
  webServer: {
    command: "npm run build && npm run preview",
    url: "http://127.0.0.1:4321",
    reuseExistingServer: false,
    timeout: 180000,
  },
});
```

`workspace/scripts/codex-revision-etapa.mjs`:

```js
// Hook PostToolUse (Bash) de Claude Code: cuando el comando del agente crea la etiqueta de la
// última tarea de una etapa (epic), pide a Codex una revisión del código de esa etapa.
// Nunca bloquea la construcción: ante cualquier fallo deja constancia y termina con 0.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const RAIZ = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const TAREAS = join(RAIZ, "blueprints", "reconversion-laboral", "tasks.json");
const CARPETA_INFORMES = join(RAIZ, "docs", "revisiones-codex");
const LIMITE_MS = 840000;

function leerEntrada() {
  try {
    return JSON.parse(readFileSync(0, "utf8"));
  } catch {
    return null;
  }
}

function git(argumentos) {
  const resultado = spawnSync("git", argumentos, { cwd: RAIZ, encoding: "utf8" });
  return { ok: resultado.status === 0, salida: (resultado.stdout ?? "").trim() };
}

function lineas(texto) {
  return texto.split(/\r?\n/).filter((linea) => linea.length > 0);
}

function compararVersiones(a, b) {
  const partesA = a.split(".").map(Number);
  const partesB = b.split(".").map(Number);
  for (let i = 0; i < Math.max(partesA.length, partesB.length); i += 1) {
    const diferencia = (partesA[i] ?? 0) - (partesB[i] ?? 0);
    if (diferencia !== 0) {
      return diferencia;
    }
  }
  return 0;
}

function ubicarCompanion() {
  const base = join(homedir(), ".claude", "plugins", "cache", "openai-codex", "codex");
  if (!existsSync(base)) {
    return null;
  }
  const versiones = readdirSync(base)
    .filter((nombre) => /^\d+(\.\d+)*$/.test(nombre))
    .sort(compararVersiones)
    .reverse();
  for (const version of versiones) {
    const ruta = join(base, version, "scripts", "codex-companion.mjs");
    if (existsSync(ruta)) {
      return ruta;
    }
  }
  return null;
}

function avisar(texto) {
  const salida = { hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: texto } };
  process.stdout.write(`${JSON.stringify(salida)}\n`);
}

function escribirInforme(epic, base, comando, resultado, stdout, stderr) {
  mkdirSync(CARPETA_INFORMES, { recursive: true });
  const ruta = join(CARPETA_INFORMES, `etapa-${epic}.md`);
  const contenido = [
    `# Revisión de Codex — etapa ${epic}`,
    "",
    `- Etapa: \`${epic}\``,
    `- Base: \`${base}\``,
    `- Fecha: ${new Date().toISOString()}`,
    `- Comando: \`${comando}\``,
    `- Resultado: ${resultado}`,
    "",
    "## Salida (stdout)",
    "",
    "````text",
    stdout,
    "````",
    "",
    "## Errores (stderr)",
    "",
    "````text",
    stderr,
    "````",
    "",
  ].join("\n");
  writeFileSync(ruta, contenido, "utf8");
  return `docs/revisiones-codex/etapa-${epic}.md`;
}

function principal() {
  const entrada = leerEntrada();
  const comando = entrada?.tool_input?.command;
  if (typeof comando !== "string") {
    return;
  }
  const coincidencia = comando.match(/git tag (paso-\d{2})/);
  if (coincidencia === null || !existsSync(TAREAS)) {
    return;
  }
  const etiqueta = coincidencia[1];
  const tareas = JSON.parse(readFileSync(TAREAS, "utf8"));
  const tarea = tareas.find((candidata) => candidata.checkpoint === etiqueta);
  if (tarea === undefined) {
    return;
  }
  const epic = tarea.epic;
  const existentes = new Set(lineas(git(["tag", "-l"]).salida));
  const cerrada = tareas
    .filter((candidata) => candidata.epic === epic)
    .every((candidata) => existentes.has(candidata.checkpoint));
  const marca = `codex-etapa-${epic}`;
  if (!cerrada || existentes.has(marca)) {
    return;
  }

  const previas = lineas(
    git([
      "for-each-ref",
      "--sort=-creatordate",
      "--format=%(refname:short)",
      "refs/tags/codex-etapa-*",
    ]).salida,
  );
  const base =
    previas[0] ?? lineas(git(["rev-list", "--max-parents=0", "HEAD"]).salida)[0] ?? "HEAD";
  const companion = ubicarCompanion();
  const argumentos = ["review", "--wait", "--base", base, "--scope", "branch", "--cwd", RAIZ];
  const textoComando = `node ${companion ?? "<codex-companion.mjs no encontrado>"} ${argumentos.join(" ")}`;

  let motivo = null;
  let stdout = "";
  let stderr = "";
  if (companion === null) {
    motivo = "no se encontró el plugin codex en ~/.claude/plugins/cache/openai-codex/codex/";
  } else {
    const resultado = spawnSync(process.execPath, [companion, ...argumentos], {
      cwd: RAIZ,
      encoding: "utf8",
      timeout: LIMITE_MS,
      maxBuffer: 64 * 1024 * 1024,
    });
    stdout = resultado.stdout ?? "";
    stderr = resultado.stderr ?? "";
    if (resultado.error !== undefined) {
      motivo = `error al ejecutar Codex: ${resultado.error.message}`;
    } else if (resultado.status !== 0) {
      motivo = `Codex terminó con código ${resultado.status}`;
    }
  }

  const informe = escribirInforme(
    epic,
    base,
    textoComando,
    motivo === null ? "correcta" : `FALLÓ (${motivo})`,
    stdout,
    stderr,
  );
  if (motivo === null) {
    git(["tag", marca]);
    avisar(
      `Revisión de Codex de la etapa ${epic} lista en ${informe}. Léela y corrige los hallazgos de severidad alta o media antes de empezar la siguiente etapa; registra cada corrección en un commit 'codex: correcciones etapa ${epic}'.`,
    );
  } else {
    avisar(
      `La revisión automática de Codex de la etapa ${epic} falló (${motivo}); el detalle está en ${informe}. La construcción sigue: continúa con la siguiente etapa y deja constancia. Una persona puede correr /codex:review a mano más tarde.`,
    );
  }
}

try {
  principal();
} catch (error) {
  const detalle = error instanceof Error ? error.message : String(error);
  avisar(
    `El hook de revisión de Codex tuvo un error inesperado (${detalle}); la construcción sigue. Una persona puede correr /codex:review a mano.`,
  );
}
process.exit(0);
```

#### Resolution convention matrix

**La convención, dicha una sola vez:** dentro de `src/` y `tests/`, las importaciones de módulos del proyecto son **relativas y con extensión explícita** (`../lib/afinidad.ts`, `./islas/Entrevista.tsx`, `../data/mapeo.json`); sin alias `@/`; los tipos con `import type` (lo exige `verbatimModuleSyntax` de la config base de Astro). `scripts/*.mjs` y `e2e/*.spec.ts` **nunca** importan módulos del proyecto.

| Contexto | Comando que lo ejercita | Forma de la convención ahí | Config y ajuste literal que lo hace funcionar |
|---|---|---|---|
| Código de la app | `npm run build` | `import { ranking } from "../../lib/afinidad.ts"` en `.astro` | Vite (dentro de Astro) resuelve la ruta tal cual; `astro.config.mjs` no necesita alias |
| Verificación de tipos | `npm run check` (`astro check`) | la misma | `tsconfig.json` — `"allowImportingTsExtensions": true` con `"noEmit": true`; `"resolveJsonModule": true` para los `.json`; `moduleResolution` `bundler` heredado de `astro/tsconfigs/strict` |
| Pruebas unitarias | `npx vitest run tests/afinidad.test.ts` | `import { crearMotor } from "../src/lib/afinidad.ts"` | `vitest.config.ts` — sin `resolve.alias`: el resolvedor de Vite resuelve `.ts` y `.json` literales |
| Scripts independientes | `node scripts/extraer-texto.mjs` (igual `copiar-perfiles.mjs`, `verificar-enlaces.mjs`) | solo `node:fs`, `node:path` y `pdfjs-dist/legacy/build/pdf.mjs`; JSON leídos con `readFileSync` | Node resuelve el especificador de paquete desde `node_modules`; `package.json` — `"type": "module"`. Ningún compilador revisa `.mjs` (`tsconfig.json` no activa `allowJs`) |
| E2E | `npx playwright test` | solo `@playwright/test` y `@axe-core/playwright` | `playwright.config.ts` — transformación TS propia de Playwright; no hay importaciones del proyecto que resolver |
| Construcción / bundle | `npm run build` | el HTML y JS de `dist/` no contienen especificadores `.ts` | Vite empaqueta la isla; las páginas no llevan JS |
| Lint / formato | `npx biome check .` | no resuelve importaciones (solo ordena) | `biome.json` — nada que configurar |

#### Cross-artifact value reconciliation

| Valor compartido | Fuente única — el archivo que lo decide | Valor literal | Dónde más aparece | Comparado |
|---|---|---|---|---|
| Host y puerto del sitio servido | `package.json` — `scripts.preview` | `--host 127.0.0.1 --port 4321` → `http://127.0.0.1:4321` | `playwright.config.ts` — `use.baseURL` y `webServer.url`; `CLAUDE.md` (tabla de comandos); épicas (sección Stack); §12 | sí |
| Directorio de salida | `astro.config.mjs` — `outDir` | `./dist` → `dist` | `package.json` — `scripts.deploy` (`wrangler pages deploy dist`); `.gitignore` `dist/`; `biome.json` `!!**/dist`; `tsconfig.json` `"dist"`; `vitest.config.ts` `dist/**`; §9 pasos 1, 9, 10, 11, 14, 15 (`dist/index.html`, `dist/ocupaciones/…`, `dist/transicion/…`, `dist/404.html`, `dist/_headers`); §20.1 | sí |
| Nombre del proyecto en Cloudflare | `package.json` — `scripts.deploy` | `reconversion-laboral` | `docs/PUBLICAR.md` (paso 15); §12; `package.json` `name` | sí |
| Carpeta de E2E | `playwright.config.ts` — `testDir` | `e2e` | §9 (`e2e/*.spec.ts` en pasos 1, 2, 8–11, 13, 14); `vitest.config.ts` `exclude: "e2e/**"` | sí |
| Patrón de pruebas unitarias | `vitest.config.ts` — `include` | `tests/**/*.test.ts` | §9 (`tests/extraccion.test.ts`, `ocupaciones`, `integridad`, `complementarios`, `afinidad`, `traductor`) | sí |
| Ruta del bundle | ubicación del bundle | `blueprints/` (`blueprints/reconversion-laboral/workspace/.` para la copia) | `biome.json` `!!**/blueprints`; `tsconfig.json` `"blueprints"`; `vitest.config.ts` `blueprints/**`; `playwright.config.ts` `**/blueprints/**`; Bootstrap `cp -R`; `.claude/settings.json` (entrada de la copia) | sí |
| URL de Capacíta-T | `src/lib/esquemas.ts` — `URL_CAPACITA_T` (paso 4) | `https://capacitacionlaboral.trabajo.gob.pe/` | `src/data/cursos.json` (30 entradas, paso 6); `Verify` del paso 6; `e2e/transicion.spec.ts` (paso 11); `CLAUDE.md`; `.claude/rules/datos.md`; §4 | sí |
| Texto del aviso | `src/components/AvisoPrototipo.astro` (paso 2) | `Prototipo para el Innovathon Ulima x Tether. No es un sitio oficial del Estado peruano.` | `PiePagina.astro`; `e2e/layout.spec.ts`; `e2e/rutas.spec.ts`; `CLAUDE.md`; `AGENTS.md` | sí |
| Scripts de datos | `package.json` — `scripts` | `copiar-perfiles` → `node scripts/copiar-perfiles.mjs`; `extraer` → `node scripts/extraer-texto.mjs`; `verificar-enlaces` → `node scripts/verificar-enlaces.mjs` | §9 pasos 3 y 6; `.claude/settings.json`; `CLAUDE.md`; §20.1 | sí |
| Fin de línea | `.gitattributes` — `* text=auto eol=lf` | `lf` | `biome.json` (formateador con `lineEnding` por defecto `lf`); archivos emitidos en `workspace/` (todos LF) | sí |
| Línea de Node | `.nvmrc` | `24` | `package.json` `engines.node` `>=24.0.0`; §10 prerrequisitos (`v24.22.1`); §11 | sí |
| Esquema de tags | §9 Checkpoints | `paso-01` … `paso-15` | `tasks.json` `checkpoint`; `epics/*.md`; §20.1; `.claude/settings.json` `Bash(git tag:*)`; expresión `/git tag (paso-\d{2})/` del hook | sí |
| Comando del hook | `.claude/settings.json` — `hooks.PostToolUse[0].hooks[0].command` | `node scripts/codex-revision-etapa.mjs` | `workspace/scripts/codex-revision-etapa.mjs` (ruta del archivo); `allow` de `.claude/settings.json`; `CLAUDE.md`; `AGENTS.md`; §3 | sí |
| Ruta de `tasks.json` que lee el hook | ubicación del bundle | `blueprints/reconversion-laboral/tasks.json` | `scripts/codex-revision-etapa.mjs` — `TAREAS`; `CLAUDE.md` | sí |
| Carpeta de informes de Codex | `scripts/codex-revision-etapa.mjs` — `CARPETA_INFORMES` | `docs/revisiones-codex` (`etapa-<epic>.md`) | `CLAUDE.md`; `AGENTS.md`; §3; §10; `epics/*.md` (Antes de seguir) | sí |
| Etiqueta de cierre de revisión | `scripts/codex-revision-etapa.mjs` — `marca` | `codex-etapa-<epic>` (por ejemplo `codex-etapa-01-base`) | `CLAUDE.md`; `epics/*.md`; §20.1 | sí |
| Origen de los PDF | `scripts/copiar-perfiles.mjs` — `ORIGEN_POR_DEFECTO` (paso 3) | `C:/Users/Home/Pictures/TETHER/innova/perfiles - copia` | §10 prerrequisitos y variables; `CLAUDE.md`; skill `agregar-ocupacion` | sí |

El contrato que más importa (puerto de `package.json` ↔ `playwright.config.ts`) existe desde el Bootstrap y se ejercita en el paso 1, cuyo `Verify` sirve el sitio construido y lo visita.

#### Byte-exact artifact reconciliation

| Artefacto byte a byte | Lo escribe | Se compara en | Reglas del blueprint que lo restringen | Llamada en el runtime fijado (§11) que lo produce | Ambas confirmadas |
|---|---|---|---|---|---|
| Valores esperados del conjunto mínimo (`0.6`, `0.428571…`, `0.514`, `0.7`, `0.4`; orden `d`, `c`, `b`) | paso 7 (tabla y `tests/afinidad.test.ts`) | paso 7 | §5: pesos 1 y 0,5; cobertura y jaccard sin redondear; afinidad `Math.round(x * 1000) / 1000`; orden afinidad → cobertura → `nombreCorto` con `localeCompare(…, "es")` | En Node 24.22.1 (2026-10-24): `Math.round(((0.6 + 1.5 / 3.5) / 2) * 1000) / 1000` → `0.514`; `1.5 / 3.5` → `0.42857142857142855`. Las tres transiciones y el ranking se ejecutaron con el código literal del paso 7 sobre `datosMinimos` y dieron exactamente esa tabla | sí |
| `69,8 %` en la portada | paso 8 (`formatearPorcentaje`) | paso 8 (`e2e/portada.spec.ts`) | §7 y §6: coma decimal, un decimal, espacio antes de `%`; dato `informalidadNacional: 69.8` de `contexto.json` | En Node 24.22.1: `(69.8).toFixed(1).replace(".", ",") + " %"` → `69,8 %`; `formatearPorcentaje(40, 0)` → `40 %` | sí |
| Estilos calculados del `body` (`rgb(255, 255, 255)`, `rgb(31, 41, 51)`, `18px`) | paso 1 (`e2e/esqueleto.spec.ts`) | paso 1 | §7: fondo `#FFFFFF`, texto `#1F2933`, base 18px (`1.125rem` sobre 16px) | `getComputedStyle(body)` en Chromium: CSSOM serializa colores sRGB como `rgb(r, g, b)` y `font-size` en `px`; `#1F2933` = (31, 41, 51) | sí (regla); la ejecución en Chromium la hace la prueba de humo del paso 1 |
| Textos fijos de la interfaz que comparan los E2E (aviso, titulares, mensajes de la entrevista, nota de demanda) | pasos 2, 8–11, 13, 14 | los mismos pasos | Cada texto aparece literal en el **Do** del paso que lo escribe y en su prueba; ningún texto lo genera un runtime | ninguna — son textos propios del proyecto | sí |

---

## 20. Acceptance Gate, Risks & Decision Log

### 20.1 Global acceptance gate

El proyecto está **hecho** cuando cada comando de abajo termina con 0 en un clon limpio (después del Bootstrap de §10), y no antes. Reúne las comprobaciones de los pasos 14 y 15 más `npm ci`, y se corre antes de cada publicación.

```bash
npm ci                                                    # expect: exit 0 — instala exactamente package-lock.json
npm run check                                             # expect: exit 0 — astro check y biome check sin errores
npm test                                                  # expect: exit 0, 0 fallidas, 0 omitidas
npm run test:e2e                                          # expect: exit 0, 0 fallidas — construye, SIRVE el sitio en 127.0.0.1:4321 y lo recorre, incluido axe
npm run build                                             # expect: exit 0
test -f dist/index.html                                   # expect: exit 0
test -f dist/404.html                                     # expect: exit 0
test -f dist/_headers                                     # expect: exit 0
test "$(ls dist/ocupaciones/*/index.html | wc -l)" -eq 9  # expect: exit 0 — una página por ocupación
test "$(ls dist/transicion/*/*/index.html | wc -l)" -eq 72   # expect: exit 0 — 9 × 8 pares
test "$(node scripts/verificar-enlaces.mjs --solo-listar)" = "https://capacitacionlaboral.trabajo.gob.pe/"   # expect: exit 0
npx playwright test e2e/accesibilidad.spec.ts             # expect: exit 0 — 0 violaciones critical/serious, scrollWidth ≤ 360
```

Cada expectativa es una propiedad o un conteo que sale del propio dataset (9 ocupaciones, 9 × 8 transiciones, 1 URL única). Cada línea termina con 0 en un build correcto y ninguna acepta "cualquier código distinto de 0".

**Lista de lanzamiento (manual)** — cada punto se comprueba una vez antes del Demo Day:

- [ ] Cada paso de §9 tiene su tag: `test "$(git tag -l 'paso-*' | wc -l)" -eq 15` termina con 0. El repositorio lo creó el Bootstrap de §10.
- [ ] Cada archivo de la tabla *Files that must be committed* de §10 está versionado — **una ruta por comando**: `git ls-files --error-unmatch package.json`, `git ls-files --error-unmatch package-lock.json`, `git ls-files --error-unmatch biome.json`, `git ls-files --error-unmatch .claude/settings.json`, `git ls-files --error-unmatch fuentes/perfiles/almacen_H2452001.pdf`, `git ls-files --error-unmatch fuentes/texto/almacen_H2452001.txt`, `git ls-files --error-unmatch src/data/mapeo.json`, `git ls-files --error-unmatch public/_headers`, `git ls-files --error-unmatch blueprints/reconversion-laboral/tasks.json`, cada uno con exit 0; y ninguno está ignorado: `status=0; git check-ignore -q src/data/mapeo.json || status=$?; test "$status" -eq 1` (1 = no ignorado · 128 = error de uso, y eso falla), repetido con `public/_headers` y con `fuentes/texto/almacen_H2452001.txt`.
- [ ] `.gitignore` estaba antes del primer commit: `test "$(git log --diff-filter=A --format=%H -- .gitignore | tail -n 1)" = "$(git rev-list --max-parents=0 HEAD)"` termina con 0.
- [ ] El Bootstrap de §10 se volvió a ejecutar completo sobre el árbol ya construido, **terminó con 0**, `package.json` sigue listando todas las dependencias y `npm run check` sigue encontrando sus binarios.
- [ ] Cada fila de *Cross-artifact value reconciliation* (§19.6) dice `Comparado: sí`, y `npm run check` se ejecutó desde la raíz **con la carpeta `blueprints/` presente**.
- [ ] Cada fila de *Byte-exact artifact reconciliation* (§19.6) dice `sí`.
- [ ] `npm run verificar-enlaces` termina con 0 (necesita internet: el portal Capacíta-T responde 2xx/3xx).
- [ ] `npm audit --omit=dev` sin vulnerabilidades altas o críticas.
- [ ] Si `npm run deploy` falla por `workerd` (npm 11 no ejecutó su script de instalación): `npm install-scripts approve workerd` y luego `npm install`, y se repite `npm run deploy`.
- [ ] Ningún no-objetivo de §1 fue construido (sin QVAC, sin login, sin `fetch`/`localStorage`, sin Compras H2452004).
- [ ] Una persona creó la cuenta gratuita de Cloudflare, ejecutó `npx wrangler login` y `npm run deploy` (pasos de `docs/PUBLICAR.md`).
- [ ] La URL `*.pages.dev` abre en un celular real: portada → ocupaciones → una transición → entrevista, con el aviso de prototipo visible en cada página.
- [ ] Las cabeceras de `_headers` llegan en producción (en el navegador, herramientas de desarrollo → Red → cabeceras de la respuesta de `/`).
- [ ] Un rollback hecho una vez a propósito (*Deployments* → *Rollback to this deployment*) y vuelta a la última versión.
- [ ] Pasada solo con teclado y una pasada con lector de pantalla (NVDA o TalkBack) sobre una transición; pasada a 200 % de zoom a 360 px (§15).
- [ ] Validación del mapeo con una persona del MTPE o un especialista en competencias (riesgo 1): revisión de al menos las transiciones que se mostrarán en el Demo Day.
- [ ] El informe de Codex de la última épica (y cualquier corrección suya) queda versionado: `git add docs/revisiones-codex && git commit -m "docs: revisión Codex etapa 06"` (si `git status` no muestra cambios en esa carpeta, no hace falta).
- [ ] Hay un informe `docs/revisiones-codex/etapa-<epic>.md` por cada épica; las épicas sin etiqueta `codex-etapa-<epic>` (revisión fallida) se revisaron a mano con `/codex:review` y sus hallazgos altos o medios se corrigieron.
- [ ] Opcional: capturas de Stitch en `docs/referencias/*.png`.
- [ ] Después del Demo Day: `npx wrangler logout` en la máquina usada para publicar.

**No se ignoran advertencias.** Una advertencia tolerada se vuelve permanente y esconde la siguiente.

### 20.2 Risk register

| Riesgo | Probabilidad | Impacto | Señal temprana | Mitigación |
|---|---|---|---|---|
| El mapeo de competencias es criterio del equipo y el jurado lo cuestiona | M | A | Una transición muestra competencias que el PDF no menciona | Evidencia por elemento en cada competencia + `erroresDeIntegridad` y pruebas de integridad (paso 5); validación con el MTPE en la lista de lanzamiento, fuera del build. Responsable: equipo de datos |
| Enlaces de capacitación rotos o inventados | B | A | `npm run verificar-enlaces` termina con 1 | Solo la URL del portal verificado, fijada por esquema (`z.literal`), y revisión con red antes del Demo Day (§20.1). Responsable: equipo |
| El sitio se confunde con un sitio oficial del Estado | M | A | Alguien pregunta si es "la página del Ministerio" | Aviso fijo en todas las páginas (probado en `e2e/rutas.spec.ts`), sin logos ni escudos, texto en el pie. Responsable: equipo |
| La demanda ilustrativa se interpreta como dato oficial | M | M | Preguntas sobre la fuente de "Alta/Media/Baja" | Insignia "Demanda referencial", nota de reemplazo por la EDO 2026, explicación en `/acerca/` y ranking que no usa la demanda (paso 7, paso 10). Responsable: equipo |
| Plazo de 4 días (Demo Day 30-oct-2026) | A | A | Un paso tarda más de una sesión | Pasos de una sesión, entrevista simulada en lugar de IA, sin backend; las tareas `p1` (pasos 12, 13, 15) son las primeras candidatas a recortar. Responsable: líder del equipo |
| La descarga de Chromium de Playwright se bloquea o tarda | M | M | `npx playwright install chromium` falla en el Bootstrap | Se instala una sola vez en el Bootstrap; si la red falla, se reintenta el Bootstrap (es idempotente) desde otra red. Responsable: quien construye |
| Node no está en el PATH de Git Bash | M | A | `node: command not found` en el primer comando | Guarda en la primera línea del Bootstrap y la línea de `~/.bashrc` de §10. Responsable: quien construye |
| Codex no disponible: plugin ausente, sesión de ChatGPT vencida o cuota agotada | M | B | El informe `docs/revisiones-codex/etapa-<epic>.md` dice `FALLÓ` y no aparece la etiqueta `codex-etapa-<epic>` | El hook nunca bloquea: deja constancia y la construcción sigue; una persona corre `/codex:review` (o `/codex:adversarial-review`) cuando haya cuota. Responsable: quien supervisa la construcción |
| El texto extraído de un PDF es pobre o desordenado | B | M | Un `.txt` con menos de 5000 caracteres (lo detecta `tests/extraccion.test.ts`) | El método de extracción ya produjo entre 18 000 y 53 000 caracteres por perfil en esta máquina; si falla, se excluye esa ocupación como Compras. Responsable: equipo de datos |

### 20.3 Decision log

| # | Decisión | Alternativa rechazada | Por qué | Se revierte si |
|---|---|---|---|---|
| 1 | Pista TypeScript/Node con Astro estático e islas React | Next.js con App Router | Sitio de contenido: HTML sin JS por defecto, una sola isla, despliegue estático gratis | Se necesita lógica de servidor (cuentas, guardar datos) |
| 2 | npm como gestor de paquetes (desvío de la pista, que pide pnpm) | pnpm con corepack | Node está en `C:/Program Files/nodejs` y `corepack enable` pide administrador; el usuario no es programador | El equipo instala Node en una ruta escribible o tiene permisos de administrador |
| 3 | `package.json` escrito por el blueprint (origen 2), sin scaffolder | `npm create astro` en el Bootstrap | Un scaffolder interactivo cuelga una ejecución desatendida y fija versiones distintas a las verificadas | Una versión futura del scaffolder es no interactiva y acepta versiones exactas |
| 4 | Datos en JSON versionados validados con zod | Base de datos (SQLite, Supabase) | 9 ocupaciones y 30 competencias caben en el repositorio; cero servicios que mantener | El catálogo pasa de unos cientos de ocupaciones o lo editan no programadores a diario |
| 5 | Cloudflare Pages Free con subida directa | Vercel Hobby, Netlify | $0 con uso comercial permitido y `_headers`; Vercel Hobby prohíbe uso comercial | Cloudflare cambia las condiciones del plan Free |
| 6 | Tailwind 4 CSS-first con tokens en `@theme` | CSS a mano | Tokens obligatorios en cada clase, escala de 4px | El equipo prefiere CSS plano y los tokens se vuelven variables CSS a mano |
| 7 | Sin estado global; `useState` solo en la isla | Librería de estado | Una sola pantalla interactiva | Aparece una segunda isla que comparte estado |
| 8 | Afinidad = promedio de cobertura y Jaccard ponderados (técnica 1, transversal 0,5) | Solo cobertura | La cobertura sola premia destinos con pocas competencias; Jaccard equilibra el tamaño | El MTPE propone una métrica oficial de cercanía ocupacional |
| 9 | Traductor por palabras clave detrás de la interfaz `TraductorCompetencias` | Integrar QVAC ya | No cabe en el plazo con calidad verificable; la costura permite el reemplazo sin tocar la UI | Tether entrega un SDK de QVAC usable en el navegador |
| 10 | Tags de checkpoint `paso-NN` | `step-NN-slug` de la plantilla | Decisión del usuario: nombres en español y cortos | Una herramienta externa exige el formato de la plantilla |
| 11 | 6 épicas pequeñas (2–4 pasos) | 2 o 3 épicas de 5–9 pasos (regla de la plantilla) | El equipo pidió que cada épica coincida con una fase de trabajo de los 4 días | Un validador o herramienta exige el rango de la plantilla: se fusionan en 3 épicas sin cambiar pasos |
| 12 | Cursos y contexto en el paso 6, antes del motor (paso 7) | Orden sugerido: motor (6) antes que cursos (7) | `calcularTransicion` devuelve el curso de cada competencia por fortalecer: el motor necesita `cursos.json` | El motor deja de devolver cursos |
| 13 | `C04` incluye la palabra clave `cuadro` (además de las listadas en el catálogo acordado) | Dejar solo `cuadre`/`cuadrar` | Con coincidencia de palabra completa, el caso de prueba acordado "cuadro la caja al cierre" no detectaría `C04` | Se cambia la detección a raíces de palabras |
| 14 | Copia de `workspace/` con `cp -R` simple | `cp -Rn` o `rsync --ignore-existing` | `rsync` no viene con Git Bash y el comportamiento de `cp -n` cambia entre versiones; los archivos de `workspace/` son de solo lectura, así que sobrescribirlos no cambia nada | Algún paso necesitara editar un archivo de `workspace/` |
| 15 | Sin modo oscuro ni fuentes web | Tema oscuro, fuente institucional | Plazo y rendimiento en celulares de gama baja | Piloto real con usuarios que lo pidan |
| 16 | Revisión de Codex por hook `PostToolUse` que se activa al etiquetar la última tarea de cada épica (6 revisiones en toda la construcción) | El `stop-review-gate` del plugin `codex@openai-codex` | El gate de parada correría una revisión al final de cada respuesta del agente: decenas de revisiones, minutos de espera cada vez y consumo de la cuota de ChatGPT del usuario. Por épica, la revisión cubre un bloque coherente de trabajo y llega a tiempo para corregir antes de la siguiente | La cuota alcanza para más revisiones y el equipo quiere revisión por paso: el hook puede activarse por cada `paso-NN` |
| 18 | `@astrojs/markdown-remark` y `oxc-transform-react` sin fijar (18 pins en vez de 20) | Fijarlos explícitamente como peers | Fijados, `npm install` del Bootstrap falló con `ERESOLVE` (peer exacto `7.2.1` de Astro 7.1.1; rangos `^0.145.0` vs `^0.152.0` de oxc) en la prueba de humo del 2026-10-24; sin ellos sale 0 y no se instalan | El proyecto empieza a usar Markdown o el compilador de React de oxc |
| 19 | Punto de retorno `git tag -f inicio-paso-NN` al empezar cada paso | `git reset --hard paso-<NN-1>` | Volver a la etiqueta del paso anterior borraría los commits `codex: correcciones etapa …` hechos entre pasos | Se elimina la revisión de Codex por épica |
| 20 | Construcción secuencial, un solo agente | Tareas en paralelo según `files` | 15 pasos de una sesión, plazo de 4 días y una sola máquina: el paralelismo no ahorra tiempo y complica las etiquetas y el hook de Codex | Se suman más agentes con ramas separadas |
| 21 | `.gitattributes` con `* text=auto eol=lf` emitido en `workspace/` | Pedir a cada persona que cambie `core.autocrlf` | Esta máquina tiene `core.autocrlf=true`: un clon o un reset sacaba CRLF y rompía `biome check` (prueba de humo del 2026-10-26). El archivo viaja con el repositorio y no depende de la configuración de cada máquina | Biome deja de exigir LF |
| 22 | Biome no procesa Markdown (`!**/*.md`) | Dejar que Biome 2.6 formatee los `.md` | Reescribía `CLAUDE.md`, las reglas y las skills en cada Bootstrap ("Fixed 6 files") y habría reformateado los informes de Codex que nadie debe editar | Se quiere un formato uniforme de la documentación |
| 23 | El código lo escribe el subagente `constructor` con el modelo `claude-sonnet-5-5` y esfuerzo alto; la sesión principal (Opus) coordina y Codex revisa cada épica | Que la sesión principal escriba todo el código | Los pasos traen contenido literal y puertas exactas: un modelo más rápido y barato basta para ejecutarlos. La sesión principal conserva el contexto del plan para coordinar y decidir, y Codex da una segunda mirada por épica. **Excepción:** el paso 5 (mapeo de competencias) exige criterio, así que la sesión principal revisa su evidencia antes del paso 6 | El constructor falla de forma repetida en pasos literales, o el mapeo resulta poco confiable con esta revisión |
| 17 | La revisión de Codex nunca es una puerta de §9 | Hacer fallar el paso si Codex reporta hallazgos | Depende de un servicio externo y de la cuota del usuario: no es decidible en esta máquina en todo momento, y bloquearía la construcción por un problema de cuenta | Codex corre localmente sin cuenta ni cuota |

### 20.4 What to build next

1. **Adaptador QVAC** (`crearTraductorQvac` con la firma de §5) — cuando Tether entregue un SDK de IA local usable en el navegador.
2. **Demanda real de la EDO 2026** en lugar de la referencial — cuando el MTPE la publique.
3. **Ocupación Compras (H2452004)** con OCR revisado — cuando haya una versión con texto del PDF.
4. **Filtro por región** — junto con datos regionales de la EDO 2026.
5. **Dominio propio** — si el proyecto sigue después del Innovathon.

---

*Fin del blueprint. El orden de construcción es §9. Detente cuando §20.1 esté en verde.*
