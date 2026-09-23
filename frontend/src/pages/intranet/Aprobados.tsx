import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TablaSolicitudes from "../../components/TablaSolicitudes";
import { api } from "../../lib/api";
import type { BandejaItem } from "../../lib/types";

/** Vista "Aprobados": bandeja filtrada por estado = Aprobado. */
export default function Aprobados() {
  const [items, setItems] = useState<BandejaItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const cargar = useCallback(() => {
    setCargando(true);
    api
      .get<BandejaItem[]>("/solicitudes/bandeja?estado=Aprobado")
      .then(setItems)
      .catch((e: Error) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Aprobados</h1>
        <p className="mt-1 text-sm text-slate-500">
          Trámites que aprobaron la revisión técnica.
        </p>
      </div>

      {cargando && <p className="text-sm text-slate-400">Cargando…</p>}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          ⚠️ {error}
        </div>
      )}

      {!cargando && !error && (
        <TablaSolicitudes
          items={items}
          vacio="Todavía no hay trámites aprobados."
          onRevisar={(item) => navigate(`/intranet/solicitudes/${item.id}`, { state: { item } })}
        />
      )}
    </div>
  );
}