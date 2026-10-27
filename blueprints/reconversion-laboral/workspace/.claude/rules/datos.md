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
