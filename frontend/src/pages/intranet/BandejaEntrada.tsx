import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TablaSolicitudes from "../../components/TablaSolicitudes";
import { api } from "../../lib/api";
import { ESTADOS_VALIDOS, type BandejaItem } from "../../lib/types";

/**
 * Bandeja del funcionario.
 * Consume GET /api/solicitudes/bandeja con filtros por estado.
 */
export default function BandejaEntrada() {
  const [items, setItems] = useState<BandejaItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>("");
  const [intento, setIntento] = useState(0); // para reintentar
  const navigate = useNavigate();

  const cargar = useCallback(() => {
    setCargando(true);
    setError(null);

    const params = new URLSearchParams();
    if (filtroEstado) params.set("estado", filtroEstado);

    const query = params.toString();
    api
      .get<BandejaItem[]>(`/solicitudes/bandeja${query ? `?${query}` : ""}`)
      .then(setItems)
      .catch((e: Error) => setError(e.message))
      .finally(() => setCargando(false));
  }, [filtroEstado]);

  useEffect(() => {
    cargar();
  }, [cargar, intento]);

  return (
    <div className="mx-auto max-w-6xl">
      {/* Encabezado */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Bandeja de Entrada</h1>
        <p className="mt-1 text-sm text-slate-500">
          Trámites ingresados por ciudadanos, listos para ser revisados.
        </p>
      </div>

      {/* Filtros */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          Estado
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="">Todos</option>
            {ESTADOS_VALIDOS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </label>
        {cargando && <span className="text-sm text-slate-400">Cargando…</span>}
      </div>

      {/* Errores */}
      {error && (
        <div className="mb-5 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>⚠️ No se pudo cargar la bandeja: {error}</span>
          <button
            onClick={() => setIntento((i) => i + 1)}
            className="rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Tabla */}
      {!error && (
        <TablaSolicitudes
          items={items}
          vacio="No hay trámites que coincidan con el filtro."
          onRevisar={(item) => navigate(`/intranet/solicitudes/${item.id}`, { state: { item } })}
        />
      )}
    </div>
  );
}