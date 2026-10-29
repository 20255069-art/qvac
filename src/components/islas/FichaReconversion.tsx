import { useState } from "react";
import type { Sugerencia } from "../../lib/sugerencias.ts";
import type { ModoTraduccion } from "../../lib/traductor/qvac.ts";
import type { CompetenciaDetectada } from "../../lib/traductor/tipos.ts";

type Props = {
  detectadas: CompetenciaDetectada[];
  sugerencias: Sugerencia[];
  departamento: string;
  modo: ModoTraduccion;
  codigoVerificacion: string;
  datosProtegidos: string[];
  bonoDilema: number;
};

export default function FichaReconversion({
  detectadas,
  sugerencias,
  departamento,
  modo,
  codigoVerificacion,
  datosProtegidos,
  bonoDilema,
}: Props) {
  const [descargado, setDescargado] = useState(false);

  const ocupacionPrincipal = sugerencias[0]?.ocupacion.nombreCorto ?? "Ocupación Evaluada";
  const afinidadBase = Math.round((sugerencias[0]?.cobertura ?? 0) * 100);
  const afinidadTotal = Math.min(100, afinidadBase + bonoDilema);

  function descargarFichaHtml() {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    const fecha = new Date().toLocaleDateString("es-PE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const filasCompetencias = detectadas
      .map(
        (d) => `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #e5e7eb;font-weight:700;color:#065f46;">${d.id}</td>
          <td style="padding:10px;border-bottom:1px solid #e5e7eb;font-weight:600;">${d.nombre}</td>
          <td style="padding:10px;border-bottom:1px solid #e5e7eb;color:#4b5563;font-style:italic;">"${d.palabrasEncontradas.join('", "')}"</td>
        </tr>`,
      )
      .join("");

    const filasSugerencias = sugerencias
      .map(
        (s) => `
        <li style="margin-bottom:8px;">
          <strong>${s.ocupacion.nombreCorto}</strong> — Afinidad base: <strong>${Math.round(s.cobertura * 100)}%</strong>
        </li>`,
      )
      .join("");

    const html = `<!doctype html>
<html lang="es-PE">
<head>
  <meta charset="utf-8" />
  <title>Ficha de Reconversión Laboral - ${codigoVerificacion}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; color: #1f2937; margin: 0; padding: 24px; background: #f3f4f6; }
    .hoja { max-width: 780px; margin: 0 auto; background: #ffffff; border: 1px solid #d1d5db; border-radius: 8px; overflow: hidden; }
    .cabecera { background: #c90000; color: #ffffff; padding: 18px 24px; display: flex; justify-content: space-between; align-items: center; }
    .contenido { padding: 24px; }
    .sello { background: #ecfdf5; border: 1px solid #6ee7b7; border-radius: 6px; padding: 12px 16px; margin-bottom: 20px; font-size: 13px; color: #065f46; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 14px; }
    th { background: #f9fafb; text-align: left; padding: 10px; border-bottom: 2px solid #d1d5db; font-size: 12px; text-transform: uppercase; }
    .pie { margin-top: 24px; padding-top: 14px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="hoja">
    <div class="cabecera">
      <div>
        <div style="font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">gob.pe · República del Perú</div>
        <div style="font-size:18px;font-weight:700;margin-top:4px;">Ministerio de Trabajo y Promoción del Empleo — Reconversión Laboral</div>
      </div>
      <div style="text-align:right;font-size:12px;">
        <div><strong>Código QVAC:</strong> ${codigoVerificacion}</div>
        <div>${fecha} · ${departamento}</div>
      </div>
    </div>
    <div class="contenido">
      <div class="sello">
        <strong>✓ Verificación Local-First QVAC (${modo === "qvac" ? "Motor IA Soberano Activo" : "Respaldo Determinista CNPO"}):</strong>
        Este resumen fue generado sin almacenar datos personales en servidores externos, validado contra el Catálogo Nacional de Perfiles Ocupacionales (CNPO - MTPE).
      </div>
      <h2 style="margin:0 0 8px;color:#111827;">Perfil Ocupacional Destacado: ${ocupacionPrincipal} (${afinidadTotal}% de compatibilidad)</h2>
      <p style="margin:0 0 16px;color:#4b5563;font-size:14px;">
        Departamento de búsqueda laboral: <strong>${departamento}</strong>
        ${bonoDilema > 0 ? ` · Incluye <strong>+${bonoDilema}%</strong> por resolución de caso práctico laboral.` : ""}
      </p>

      <h3 style="margin:20px 0 8px;font-size:15px;color:#c90000;text-transform:uppercase;">1. Competencias Empíricas Reconocidas (${detectadas.length})</h3>
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Competencia Oficial CNPO</th>
            <th>Evidencia del relato</th>
          </tr>
        </thead>
        <tbody>
          ${filasCompetencias}
        </tbody>
      </table>

      <h3 style="margin:24px 0 8px;font-size:15px;color:#c90000;text-transform:uppercase;">2. Rutas de Empleabilidad Sugeridas</h3>
      <ul style="font-size:14px;line-height:1.6;padding-left:20px;">
        ${filasSugerencias}
      </ul>

      <div class="pie">
        <span>Plataforma de Reconversión Laboral MTPE · Impulsado por Tether QVAC</span>
        <span>Cursos gratuitos en: https://capacitacionlaboral.trabajo.gob.pe/</span>
      </div>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `ficha-competencias-${codigoVerificacion.toLowerCase()}.html`;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    URL.revokeObjectURL(url);

    setDescargado(true);
    setTimeout(() => setDescargado(false), 3000);
  }

  return (
    <div className="caja mt-6 border-2 border-emerald-600/30 bg-gradient-to-r from-emerald-50/50 via-white to-red-50/30 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-900">
            <span>🛡️ Escudo de Privacidad Soberana QVAC</span>
            <span>•</span>
            <span className="font-mono">{codigoVerificacion}</span>
          </div>
          <h3 className="text-lg font-bold text-texto">
            Tu Constancia de Competencias Reconocidas (Lista para llevar)
          </h3>
          <p className="text-sm text-texto-suave max-w-2xl">
            Descarga tu ficha en formato oficial para adjuntarla a tu currículum, enviarla por
            WhatsApp a un empleador o llevarla impresa al Centro de Empleo del MTPE en{" "}
            <strong className="text-texto">{departamento}</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={descargarFichaHtml}
            className="inline-flex items-center gap-2 rounded-md bg-primario px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primario-oscuro"
          >
            <svg
              aria-hidden="true"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {descargado
              ? "✓ ¡Ficha descargada en tu equipo!"
              : "📄 Descargar mi Ficha de Competencias"}
          </button>

          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") window.print();
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-borde bg-white px-3.5 py-2.5 text-sm font-semibold text-texto shadow-xs hover:bg-superficie"
          >
            🖨️ Imprimir resumen
          </button>
        </div>
      </div>

      {/* Resumen de Garantía Local-First */}
      <div className="mt-4 grid gap-2 border-t border-borde pt-3 text-xs text-texto-suave sm:grid-cols-3">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-emerald-700">✓ Cero huella en la nube:</span>
          <span>Sin almacenamiento en base de datos ni cookies.</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-emerald-700">✓ Filtro anti-fuga PII:</span>
          <span>
            {datosProtegidos.length > 0
              ? `Se protegieron automáticamente: ${datosProtegidos.join(", ")}.`
              : "Verificado en memoria local sin datos sensibles expuestos."}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-emerald-700">✓ Catálogo oficial:</span>
          <span>Alineado al estándar CNPO del MTPE Perú.</span>
        </div>
      </div>
    </div>
  );
}
