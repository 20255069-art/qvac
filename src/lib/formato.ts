export function formatearPorcentaje(valor: number, decimales = 1): string {
  return `${valor.toFixed(decimales).replace(".", ",")} %`;
}
