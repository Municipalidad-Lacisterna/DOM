/**
 * Visor de PDF en el navegador (sin descarga forzada).
 * Usa <iframe> apuntando a GET /api/documentos/{id}/archivo que el
 * backend entrega con Content-Disposition: inline.
 */
export default function VisorPDF({ documentoId, nombre }: { documentoId: number; nombre: string }) {
  const url = `/api/documentos/${documentoId}/archivo`;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Barra superior del visor */}
      <div className="flex items-center justify-between gap-3 bg-slate-900 px-4 py-2.5">
        <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-white">
          <span aria-hidden>📄</span>
          <span className="truncate">{nombre}</span>
        </span>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 rounded-md bg-slate-700 px-2.5 py-1 text-xs font-medium text-slate-100 transition-colors hover:bg-slate-600"
        >
          Abrir en pestaña ↗
        </a>
      </div>

      {/* PDF inline */}
      <iframe
        src={url}
        title={nombre}
        className="h-[480px] w-full bg-white"
        // Los visores nativos de PDF a veces necesitan this para renderizar bien
        allowFullScreen
      />
    </div>
  );
}