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
- Solo tokens de `src/styles/global.css`: `bg-primario`, `text-texto`, `text-texto-suave`, `bg-superficie`, `border-borde`, `text-enlace`, `bg-ya-tienes-fondo`, `text-ya-tienes-texto`, `bg-por-fortalecer-fondo`, `text-por-fortalecer-texto`, `bg-aviso-fondo`, `text-aviso-texto`, `bg-referencial-fondo`, `text-referencial-texto` (y, solo dentro de los íconos, `--color-icono-trazo` / `--color-icono-relleno`). Ningún hex suelto ni color de la paleta por defecto de Tailwind.
- El color nunca es la única señal: cada chip muestra "Ya lo tienes" o "Por fortalecer" como texto, y cada insignia dice "Demanda referencial: Alta|Media|Baja".
- Móvil primero: diseña a 360px; contenedores `mx-auto max-w-contenido px-4`; textos largos (ids de elemento) con `break-words`. Nada puede producir scroll horizontal a 360px.
- Botones y enlaces con aspecto de botón: `min-h-12` (48px), `w-full sm:w-auto`, `rounded-base`.
- Enlaces dentro de la barra roja usan `text-fondo` y `focus-visible:outline-fondo` para que el foco se vea sobre el rojo.
- Islas React solo con interacción, con `client:load`; hoy solo `src/components/islas/Entrevista.tsx`. Una página sin isla no lleva `<script>`.
- En React: `<label htmlFor>` en cada campo, errores en un elemento `role="alert"`, resultados en una región `aria-live="polite"`, botones con `type`.
- Sin logos, escudos, banderas ni recursos de gob.pe. Sin imágenes de mapa de bits: los únicos gráficos son los íconos SVG en línea de `src/components/IconoOcupacion.astro` (decorativos, `aria-hidden`), que usan `--color-icono-trazo`, `--color-icono-relleno` y `--color-primario`.
- Textos en español del Perú, trato de "tú". Nunca digas que la herramienta evalúa o certifica: es una orientación preliminar.
- Stitch (Google) es solo referencia visual opcional (`docs/referencias/*.png`); estos tokens ganan y nunca se pega su código.
