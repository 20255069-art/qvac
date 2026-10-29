import type { Competencia } from "../esquemas.ts";
import type { DetectadaQvac } from "./qvac-protocolo.ts";

const SINONIMOS_PERU: Record<string, string[]> = {
  C01: ["atendi", "atendia", "recibir clientes", "orientar personas", "mostrador", "ventanilla"],
  C02: ["sencillo", "billete falso", "caja chica", "dar vuelto", "contar plata", "cobro"],
  C03: ["billetera digital", "izipay", "niubiz", "culqi", "vendemas", "pago con qr", "contactless"],
  C04: ["cierre de turno", "quadrar", "cuadraba", "arqueaba", "balance de caja", "cero descuadres"],
  C05: ["sistema pos", "erp", "wms", "hoja de calculo", "ingresar datos", "computador"],
  C06: ["nota de venta", "guia de remision", "ticket", "boletas", "facturas", "sunat"],
  C07: ["merma", "mermas", "quiebre de stock", "peps", "fifo", "contar mercaderia", "anaquel"],
  C08: ["gondola", "gondolas", "reponedor", "reposicion", "picking", "packing", "estiba", "bodega"],
  C09: ["5s", "clasificacion", "ordenado", "limpio y ordenado", "rotular", "etiquetar"],
  C10: ["aseo", "higienizar", "trapear", "trapeado", "barrido", "sanitizar", "pisos"],
  C11: ["cloro", "amonio", "poett", "pino", "desinfectantes", "diluir", "quimico"],
  C12: ["equipo", "balanza", "lectora", "escaner", "pistola de barras", "cuidado de maquinas"],
  C13: ["lavadora", "secadora", "plancha", "vapor", "quitar manchas", "desmanchar", "doblar ropa"],
  C14: ["manteles", "edredon", "fundas", "blanqueria", "toalleria", "cubrecamas"],
  C15: ["cuartelero", "housekeeping", "hotel", "hostal", "hacer cuartos", "arreglar camas"],
  C16: ["mesero", "mesera", "azafata", "comedor", "bandeja", "tomar pedido", "restaurante"],
  C17: ["picar", "sazonar", "aderezo", "ayudante de cocina", "preparar platos", "menaje"],
  C18: ["cadena de frio", "vencimiento", "fecha de vencimiento", "bpm", "camara de frio", "fresco"],
  C19: ["call center", "teleoperador", "telemarketing", "auriculares", "atender llamadas"],
  C20: ["asesorar", "guiar", "explicaba", "recomendaba", "ayudar a elegir"],
  C21: ["cliente molesto", "inconveniente", "calmar", "dar solucion", "resuelvo", "resolvi"],
  C22: [
    "impulsar",
    "impulsador",
    "ofrecia",
    "vendi",
    "vendia",
    "meta de ventas",
    "cierre de venta",
  ],
  C23: ["parihuela", "pallet", "pallets", "apilador", "cargar cajas", "descargar camion"],
  C24: ["botas de seguridad", "faja", "lentes", "prevencion", "riesgo", "charla de 5 minutos"],
  C25: ["abuelito", "anciano", "ninera", "dar medicinas", "alimentar", "asistir"],
  C26: ["buen trato", "paciencia", "respetuoso", "hablar claro", "carisma", "empatia"],
  C27: ["apoyarnos", "entre todos", "ayudaba a mis companeros", "relevo", "turno"],
  C28: ["temprano", "a tiempo", "nunca falto", "compromiso", "confianza", "honesto"],
  C29: ["campana", "hora pico", "lleno", "bastante gente", "bajo presion", "apuro"],
  C30: ["minucioso", "orden", "exacto", "sin errores", "revisaba", "control de calidad"],
};

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function expresionPara(frase: string): RegExp {
  const escapada = frase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s+");
  return new RegExp(`\\b${escapada}\\b`, "g");
}

const NEGACION = /\b(no|nunca|ni|jamas|tampoco)[ ]+(?:\S+[ ]+){0,2}$/;

function extraerEvidencias(
  textoOriginal: string,
  textoNormalizado: string,
  frasesClave: string[],
): string[] {
  const evidencias: string[] = [];
  for (const frase of frasesClave) {
    const regex = expresionPara(normalizar(frase));
    for (const coincidencia of textoNormalizado.matchAll(regex)) {
      const idx = coincidencia.index ?? 0;
      if (NEGACION.test(textoNormalizado.slice(0, idx))) {
        continue;
      }
      const inicio = Math.max(0, textoOriginal.lastIndexOf(" ", Math.max(0, idx - 18)) + 1);
      const finEspacio = textoOriginal.indexOf(" ", idx + coincidencia[0].length + 18);
      const fin = finEspacio === -1 ? Math.min(textoOriginal.length, idx + 45) : finEspacio;
      const fragmento = textoOriginal
        .slice(inicio, fin)
        .replace(/^[,.;:!\s]+|[,.;:!\s]+$/g, "")
        .trim();
      if (fragmento.length > 0 && !evidencias.includes(fragmento)) {
        evidencias.push(fragmento);
      }
      if (evidencias.length >= 3) break;
    }
    if (evidencias.length >= 3) break;
  }
  return evidencias;
}

/**
 * Clasificador local-first determinista con comprensión de negaciones y jerga laboral peruana.
 * Garantiza disponibilidad del 100% en el servidor SSR incluso si el túnel P2P o el daemon externo se reinician.
 */
export function clasificarRelatoQvacLocal(
  relato: string,
  catalogoCompetencias: Pick<Competencia, "id" | "palabrasClave">[],
): DetectadaQvac[] {
  const textoOriginal = relato.trim();
  const textoNormalizado = normalizar(textoOriginal);
  if (textoNormalizado.length === 0) {
    return [];
  }

  const detectadas: DetectadaQvac[] = [];
  for (const comp of catalogoCompetencias) {
    const frases = [...comp.palabrasClave, ...(SINONIMOS_PERU[comp.id] ?? [])];
    const evidencias = extraerEvidencias(textoOriginal, textoNormalizado, frases);
    if (evidencias.length > 0) {
      detectadas.push({
        id: comp.id,
        evidencias,
      });
    }
  }
  return detectadas;
}
