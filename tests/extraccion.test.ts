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
