const ESTILOS: Record<string, string> = {
  Ingresado: "bg-slate-100 text-slate-700 ring-slate-300",
  "En Revisión": "bg-amber-50 text-amber-700 ring-amber-300",
  "En Corrección": "bg-orange-50 text-orange-700 ring-orange-300",
  Aprobado: "bg-emerald-50 text-emerald-700 ring-emerald-300",
  Rechazado: "bg-red-50 text-red-700 ring-red-300",
  Finalizado: "bg-teal-50 text-teal-700 ring-teal-300",
};

/** Chip de estado con paleta consistente en toda la app. */
export default function EstadoBadge({ estado }: { estado: string }) {
  const clases = ESTILOS[estado] ?? "bg-gray-100 text-gray-600 ring-gray-300";
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${clases}`}
    >
      {estado}
    </span>
  );
}