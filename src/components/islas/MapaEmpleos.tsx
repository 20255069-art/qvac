import { useMemo, useState } from "react";

type Empleo = {
  id: string;
  titulo: string;
  empresa: string;
  distrito: string;
  distancia: string;
  sueldo: string;
  tipoContrato: string;
  compatibilidad: string;
  coordenadasCss: { top: string; left: string };
};

type Props = {
  departamento: string;
  ocupacionSugerida?: string;
};

const EMPLEOS_POR_DEPARTAMENTO: Record<string, Empleo[]> = {
  Lima: [
    {
      id: "lim-1",
      titulo: "Operario de Almacén e Inventarios",
      empresa: "Consorcio Logístico del Perú S.A.",
      distrito: "San Luis / Cercado",
      distancia: "a 1.8 km",
      sueldo: "S/ 1,850 - S/ 2,300",
      tipoContrato: "Planilla completa + Beneficios",
      compatibilidad: "85% de afinidad",
      coordenadasCss: { top: "35%", left: "46%" },
    },
    {
      id: "lim-2",
      titulo: "Cajero(a) Comercial y Control POS",
      empresa: "Supermercados & Retail Andino S.A.",
      distrito: "Jesús María / Lince",
      distancia: "a 2.5 km",
      sueldo: "S/ 1,600 - S/ 1,950",
      tipoContrato: "Horarios flexibles + Bonos",
      compatibilidad: "80% de afinidad",
      coordenadasCss: { top: "52%", left: "38%" },
    },
    {
      id: "lim-3",
      titulo: "Auxiliar de Despacho y Picking",
      empresa: "Distribuidora Mayorista Central",
      distrito: "Ate / La Victoria",
      distancia: "a 3.4 km",
      sueldo: "S/ 1,750 - S/ 2,150",
      tipoContrato: "Ingreso inmediato en planilla",
      compatibilidad: "75% de afinidad",
      coordenadasCss: { top: "42%", left: "62%" },
    },
  ],
  Arequipa: [
    {
      id: "aqp-1",
      titulo: "Operario de Almacén y Despacho",
      empresa: "Logística Industrial del Sur S.A.C.",
      distrito: "Parque Industrial, Arequipa",
      distancia: "a 1.5 km",
      sueldo: "S/ 1,800 - S/ 2,200",
      tipoContrato: "Planilla + Bono de productividad",
      compatibilidad: "84% de afinidad",
      coordenadasCss: { top: "40%", left: "45%" },
    },
    {
      id: "aqp-2",
      titulo: "Cajero(a) / Promotor de Servicios",
      empresa: "Comercializadora Arequipeña",
      distrito: "Cayma / Yanahuara",
      distancia: "a 2.8 km",
      sueldo: "S/ 1,650 - S/ 1,900",
      tipoContrato: "Planilla de ley",
      compatibilidad: "78% de afinidad",
      coordenadasCss: { top: "58%", left: "55%" },
    },
    {
      id: "aqp-3",
      titulo: "Auxiliar de Mantenimiento y Carga",
      empresa: "Servicios Generales del Sur",
      distrito: "Cerro Colorado",
      distancia: "a 3.2 km",
      sueldo: "S/ 1,700 - S/ 2,050",
      tipoContrato: "Seguro SCTR + Capacitación",
      compatibilidad: "74% de afinidad",
      coordenadasCss: { top: "30%", left: "35%" },
    },
  ],
  "La Libertad": [
    {
      id: "lal-1",
      titulo: "Auxiliar de Almacén y Control de Stock",
      empresa: "Agroexportadora & Distribución Norte",
      distrito: "Trujillo Centro",
      distancia: "a 1.6 km",
      sueldo: "S/ 1,750 - S/ 2,150",
      tipoContrato: "Planilla directa",
      compatibilidad: "82% de afinidad",
      coordenadasCss: { top: "45%", left: "48%" },
    },
    {
      id: "lal-2",
      titulo: "Cajero(a) Punto de Venta Retail",
      empresa: "Tiendas del Norte S.A.C.",
      distrito: "Víctor Larco Herrera",
      distancia: "a 2.7 km",
      sueldo: "S/ 1,600 - S/ 1,850",
      tipoContrato: "Planilla completa",
      compatibilidad: "79% de afinidad",
      coordenadasCss: { top: "60%", left: "40%" },
    },
    {
      id: "lal-3",
      titulo: "Operario de Limpieza y Mantenimiento",
      empresa: "Servicios Limpios del Norte",
      distrito: "La Esperanza",
      distancia: "a 3.5 km",
      sueldo: "S/ 1,550 - S/ 1,800",
      tipoContrato: "Beneficios completos",
      compatibilidad: "73% de afinidad",
      coordenadasCss: { top: "30%", left: "58%" },
    },
  ],
  Cusco: [
    {
      id: "cus-1",
      titulo: "Auxiliar de Almacén y Logística Turística",
      empresa: "Cadena Hotelera & Servicios del Cusco",
      distrito: "Wanchaq",
      distancia: "a 1.4 km",
      sueldo: "S/ 1,800 - S/ 2,300",
      tipoContrato: "Planilla + Alimentación",
      compatibilidad: "86% de afinidad",
      coordenadasCss: { top: "44%", left: "50%" },
    },
    {
      id: "cus-2",
      titulo: "Atención al Cliente y Caja",
      empresa: "Gastronomía Andina Cusco S.A.C.",
      distrito: "Cusco Histórico",
      distancia: "a 2.1 km",
      sueldo: "S/ 1,700 - S/ 2,100",
      tipoContrato: "Planilla de ley",
      compatibilidad: "80% de afinidad",
      coordenadasCss: { top: "35%", left: "42%" },
    },
    {
      id: "cus-3",
      titulo: "Operario(a) de Housekeeping",
      empresa: "Servicios Hoteleros del Valle",
      distrito: "San Sebastián",
      distancia: "a 3.3 km",
      sueldo: "S/ 1,650 - S/ 1,950",
      tipoContrato: "Seguro de salud + Beneficios",
      compatibilidad: "76% de afinidad",
      coordenadasCss: { top: "55%", left: "65%" },
    },
  ],
};

export default function MapaEmpleos({ departamento, ocupacionSugerida }: Props) {
  const [empleoSeleccionado, setEmpleoSeleccionado] = useState<string>("pin-1");

  const empleos = useMemo(() => {
    const lista = EMPLEOS_POR_DEPARTAMENTO[departamento] ?? EMPLEOS_POR_DEPARTAMENTO.Lima ?? [];
    if (ocupacionSugerida && lista[0]) {
      // Ajustar título del primer pin a la ocupación sugerida para mayor impacto
      const primero = {
        ...lista[0],
        titulo: `${ocupacionSugerida} (Vacante cercana)`,
      };
      return [primero, ...lista.slice(1)];
    }
    return lista;
  }, [departamento, ocupacionSugerida]);

  const empleoActivo = empleos.find((e) => e.id === empleoSeleccionado) ?? empleos[0];

  return (
    <div className="caja mt-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-borde pb-3">
        <div>
          <span className="inline-block rounded bg-red-100 px-2 py-0.5 text-xs font-bold text-primario uppercase">
            Bolsa de Trabajo MTPE
          </span>
          <h3 className="mt-1 text-lg font-bold text-texto">
            Ofertas Laborales en {departamento} conectadas con tu Árbol de Habilidades
          </h3>
        </div>
        <a
          href="https://empleosperu.trabajo.gob.pe/"
          target="_blank"
          rel="noreferrer"
          className="text-xs font-bold text-primario hover:underline inline-flex items-center gap-1"
        >
          Ir a Empleos Perú ↗
        </a>
      </div>

      <p className="text-sm text-texto-suave">
        Encontramos <strong className="text-texto">3 vacantes activas en planilla</strong> en tu
        zona que coinciden con las competencias que demostraste en tu relato.
      </p>

      {/* Mapa Mockeado Interactivo de Alta Calidad */}
      <div className="relative h-72 sm:h-80 w-full overflow-hidden rounded-md border border-gray-300 bg-[#E8ECEF] shadow-inner">
        {/* Grilla y trazado cartográfico esquemático con SVG */}
        <svg
          aria-hidden="true"
          className="absolute inset-0 h-full w-full opacity-40"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="calle-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#CBD5E1" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#calle-grid)" />
          {/* Avenidas simuladas */}
          <path
            d="M -20 180 Q 200 120 600 240 T 1200 160"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="8"
          />
          <path
            d="M -20 180 Q 200 120 600 240 T 1200 160"
            fill="none"
            stroke="#F87171"
            strokeWidth="2"
            strokeDasharray="6 4"
          />
          <path d="M 300 -20 Q 320 200 280 400" fill="none" stroke="#FFFFFF" strokeWidth="6" />
          <path d="M 600 -20 Q 560 180 620 400" fill="none" stroke="#FFFFFF" strokeWidth="6" />
        </svg>

        {/* Indicador de región y escala */}
        <div className="absolute top-3 left-3 rounded-md bg-white/95 px-3 py-1.5 shadow-sm border border-gray-200 text-xs">
          <p className="font-bold text-texto">📍 Región: {departamento}</p>
          <p className="text-texto-suave">Radio de búsqueda: 5 km</p>
        </div>

        {/* Brújula institucional */}
        <div className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 shadow-sm text-xs font-bold text-primario border border-gray-200">
          N
        </div>

        {/* 3 Pines flotantes en el mapa */}
        {empleos.map((emp, index) => {
          const esActivo = emp.id === empleoActivo?.id;
          return (
            <button
              key={emp.id}
              type="button"
              onClick={() => setEmpleoSeleccionado(emp.id)}
              style={emp.coordenadasCss}
              aria-label={`Ver oferta: ${emp.titulo}`}
              className="group absolute -translate-x-1/2 -translate-y-full focus:outline-none"
            >
              <div className="relative flex flex-col items-center">
                {/* Etiqueta flotante */}
                <span
                  className={`mb-1 whitespace-nowrap rounded px-2 py-0.5 text-xs font-bold shadow-md transition-all ${
                    esActivo
                      ? "bg-primario text-white scale-105"
                      : "bg-white text-texto border border-gray-300 hover:bg-red-50"
                  }`}
                >
                  #{index + 1} {emp.distancia}
                </span>

                {/* Ícono de Pin con onda de pulso */}
                <div className="relative">
                  {esActivo && (
                    <span className="animate-ping absolute -inset-1 rounded-full bg-red-400 opacity-75"></span>
                  )}
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full shadow-md text-white font-bold text-xs ${
                      esActivo
                        ? "bg-primario ring-4 ring-red-200"
                        : "bg-gray-700 group-hover:bg-red-600"
                    }`}
                  >
                    💼
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tarjeta flotante interactiva de detalle del empleo seleccionado */}
      {empleoActivo && (
        <div className="rounded-md border-2 border-primario/30 bg-red-50/40 p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                  {empleoActivo.compatibilidad}
                </span>
                <span className="text-xs text-texto-suave font-medium">
                  {empleoActivo.distancia} ({empleoActivo.distrito})
                </span>
              </div>
              <h4 className="mt-1 text-base sm:text-lg font-bold text-texto">
                {empleoActivo.titulo}
              </h4>
              <p className="text-sm font-semibold text-primario">{empleoActivo.empresa}</p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-base sm:text-lg font-bold text-emerald-700">
                {empleoActivo.sueldo}
              </span>
              <p className="text-xs text-texto-suave">{empleoActivo.tipoContrato}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-red-200/60 pt-3">
            <span className="text-xs text-texto-suave">
              ✓ Registrado en la Bolsa Pública de Empleos Perú
            </span>
            <a
              href="https://empleosperu.trabajo.gob.pe/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-md bg-primario px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-primario-oscuro"
            >
              Postular con mi Perfil ↗
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
