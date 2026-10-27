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
