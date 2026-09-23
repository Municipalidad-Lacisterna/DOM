/** Configuración (placeholder de Fase 3 — se conecta en Fases posteriores). */
export default function Configuracion() {
  const secciones = [
    {
      titulo: "Departamentos",
      desc: "Administrar los departamentos responsables de cada tipo de trámite.",
    },
    {
      titulo: "Usuarios & Roles",
      desc: "Alta de funcionarios y asignación de roles (admin, ejecutor, visor).",
    },
    {
      titulo: "Tipos de trámite",
      desc: "Catálogo de trámites disponibles en el portal ciudadano.",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
        <p className="mt-1 text-sm text-slate-500">
          Administración general del sistema.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {secciones.map((s) => (
          <div
            key={s.titulo}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <h2 className="font-semibold text-slate-900">{s.titulo}</h2>
            <p className="mt-1 text-sm text-slate-500">{s.desc}</p>
            <button className="mt-4 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50">
              Administrar →
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
        💡 Estas secciones se implementan en fases posteriores del proyecto.
      </div>
    </div>
  );
}