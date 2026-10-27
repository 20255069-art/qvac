import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import ocupacionesJson from "../src/data/ocupaciones.json";
import { esquemaOcupacion, esquemaOcupaciones, ID_OCUPACIONES } from "../src/lib/esquemas.ts";

const TABLA = [
  [
    "almacen",
    "H2452001",
    "Operario(a) de almacén",
    "fuentes/perfiles/almacen_H2452001.pdf",
    "alta",
  ],
  [
    "atencion_telefonica",
    "M2982001",
    "Teleoperador(a)",
    "fuentes/perfiles/atencion_telefono_M2982001.pdf",
    "alta",
  ],
  [
    "caja_comercial",
    "G2347002",
    "Cajero(a) de tienda",
    "fuentes/perfiles/caja_comercial_G2347002.pdf",
    "media",
  ],
  [
    "caja_financiera",
    "K2764001",
    "Cajero(a) de entidad financiera",
    "fuentes/perfiles/caja_financiera_K2764001.pdf",
    "media",
  ],
  [
    "housekeeping",
    "I2555002",
    "Cuartelero(a) de hotel",
    "fuentes/perfiles/housekeeping_I2555002.pdf",
    "media",
  ],
  [
    "lavanderia",
    "S3496002",
    "Lavandero(a) y planchador(a)",
    "fuentes/perfiles/lavanderia_S3496002.pdf",
    "baja",
  ],
  [
    "limpieza",
    "M2981001",
    "Operario(a) de limpieza",
    "fuentes/perfiles/limpieza_M2981001.pdf",
    "media",
  ],
  [
    "salon_comidas",
    "I2556002",
    "Mozo(a) / ayudante de salón",
    "fuentes/perfiles/salon_comidas_I2556002.pdf",
    "media",
  ],
  [
    "trabajador_hogar",
    "S3497002",
    "Trabajador(a) del hogar",
    "fuentes/perfiles/trabajador_hogar_S3497002.pdf",
    "baja",
  ],
] as const;

const ocupaciones = esquemaOcupaciones.parse(ocupacionesJson);
const VERBOS_SUPERVISOR = /^(Supervisar|Organizar|Coordinar|Planificar|Gestionar)\b/;

describe("ocupaciones.json", () => {
  it("cumple el esquema y los valores fijos de la tabla", () => {
    expect(ocupaciones.map((o) => o.id)).toEqual([...ID_OCUPACIONES]);
    expect(ocupaciones.map((o) => [o.id, o.codigo, o.nombreCorto, o.pdf, o.demanda.nivel])).toEqual(
      TABLA.map((fila) => [...fila]),
    );
    for (const o of ocupaciones) {
      expect(o.demanda.tipo).toBe("referencial");
    }
  });

  describe.each(ocupaciones.map((o) => [o.id, o] as const))("%s", (_id, o) => {
    it("tiene su PDF y estándares coherentes", () => {
      expect(existsSync(o.pdf)).toBe(true);
      for (const estandar of o.estandares) {
        expect(estandar.codigo.startsWith(`${o.codigo}-`)).toBe(true);
        for (const [indice, elemento] of estandar.elementos.entries()) {
          expect(elemento.id).toBe(`${estandar.codigo}-E${indice + 1}`);
        }
        if (VERBOS_SUPERVISOR.test(estandar.descripcion)) {
          expect(estandar.rol).toBe("supervisor");
        }
      }
      const operativos = o.estandares.filter((e) => e.rol === "operativo");
      expect(operativos.length).toBeGreaterThan(0);
      expect(operativos.some((e) => e.elementos.length > 0)).toBe(true);
    });

    it("cada código de estándar aparece en el texto extraído", () => {
      const base = o.pdf.replace("fuentes/perfiles/", "").replace(".pdf", "");
      const texto = readFileSync(`fuentes/texto/${base}.txt`, "utf8");
      for (const estandar of o.estandares) {
        const [codigoOcupacion, numero] = estandar.codigo.split("-");
        const patron = new RegExp(`${codigoOcupacion}\\s*[-\\u2013]\\s*${numero}`);
        expect(texto).toMatch(patron);
      }
    });
  });

  it("rechaza un estándar con rol jefe", () => {
    const copia = structuredClone(ocupaciones[0]);
    (copia.estandares[0] as { rol: string }).rol = "jefe";
    expect(esquemaOcupacion.safeParse(copia).success).toBe(false);
  });
});
