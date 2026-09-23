import type { BandejaItem } from "../lib/types";
import EstadoBadge from "./EstadoBadge";

interface Props {
  items: BandejaItem[];
  onRevisar: (item: BandejaItem) => void;
  vacio: string;
}

/** Tabla de solicitudes reutilizable (Bandeja, Aprobados, etc.). */
export default function TablaSolicitudes({ items, onRevisar, vacio }: Props) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
        {vacio}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 font-semibold">Folio</th>
            <th className="px-4 py-3 font-semibold">Trámite</th>
            <th className="px-4 py-3 font-semibold">Solicitante</th>
            <th className="px-4 py-3 font-semibold">Estado</th>
            <th className="px-4 py-3 text-right font-semibold">Acción</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((s) => (
            <tr key={s.id} className="transition-colors hover:bg-sky-50/40">
              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-slate-700">
                {s.numero_ingreso}
              </td>
              <td className="px-4 py-3">
                <p className="font-medium text-slate-800">{s.tipo_tramite}</p>
                <p className="text-xs text-slate-500">{s.depto_responsable}</p>
              </td>
              <td className="px-4 py-3">
                <p className="text-slate-800">{s.solicitante_nombres}</p>
                <p className="text-xs text-slate-500">{s.solicitante_rut}</p>
              </td>
              <td className="px-4 py-3">
                <EstadoBadge estado={s.estado_actual} />
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => onRevisar(s)}
                  className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-sky-700"
                >
                  Revisar →
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}