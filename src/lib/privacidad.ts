export type ResultadoSanitizacion = {
  textoSanitizado: string;
  datosProtegidos: number;
  tiposDetectados: string[];
};

/**
 * Sanitiza datos personales sensibles (DNI, RUC, teléfono celular peruano, correo)
 * en memoria local antes de enviar o procesar relatos, garantizando soberanía de datos.
 */
export function sanitizarRelatoCiudadano(texto: string): ResultadoSanitizacion {
  let datosProtegidos = 0;
  const tipos = new Set<string>();

  let limpio = texto.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, () => {
    datosProtegidos += 1;
    tipos.add("correo electrónico");
    return "[CORREO_PROTEGIDO]";
  });

  limpio = limpio.replace(/\b(?:10|20)\d{9}\b/g, () => {
    datosProtegidos += 1;
    tipos.add("RUC");
    return "[RUC_PROTEGIDO]";
  });

  limpio = limpio.replace(/\b(?:\+?51[\s-]?)?9\d{2}[\s-]?\d{3}[\s-]?\d{3}\b/g, () => {
    datosProtegidos += 1;
    tipos.add("celular");
    return "[CELULAR_PROTEGIDO]";
  });

  limpio = limpio.replace(/\b\d{8}\b/g, () => {
    datosProtegidos += 1;
    tipos.add("DNI");
    return "[DNI_PROTEGIDO]";
  });

  return {
    textoSanitizado: limpio,
    datosProtegidos,
    tiposDetectados: [...tipos],
  };
}

/**
 * Genera una huella determinista corta (estilo hash local QVAC-MTPE) sin requerir APIs externas.
 */
export function generarCodigoVerificacionQvac(
  idsCompetencias: string[],
  departamento: string,
): string {
  const semilla = `${idsCompetencias.slice().sort().join("-")}|${departamento}|2026`;
  let hash = 2166136261;
  for (let i = 0; i < semilla.length; i += 1) {
    hash ^= semilla.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const hex = (hash >>> 0).toString(16).toUpperCase().padStart(8, "0");
  return `MTPE-QVAC-2026-${hex}`;
}
