import { Link, NavLink, Outlet } from "react-router-dom";

/**
 * Shell del Portal Ciudadano: barra superior simple + contenido.
 * Público: el ciudadano no inicia sesión.
 */
export default function LayoutCiudadano() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Barra superior */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <NavLink to="/" className="flex items-center gap-2">
            <span className="text-xl">🏛️</span>
            <span className="font-semibold text-slate-900">DOM en Línea</span>
          </NavLink>

          <nav className="flex items-center gap-4">
            <NavLink
              to="/ciudadano/nuevo-tramite"
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? "bg-sky-50 text-sky-700" : "text-slate-600 hover:text-slate-900"
                }`
              }
            >
              Nuevo trámite
            </NavLink>
            <NavLink
              to="/estado"
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:text-slate-900"
                }`
              }
            >
              Consultar estado
            </NavLink>
            <span className="h-5 w-px bg-slate-200" />
            <NavLink
              to="/login/funcionarios"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Área Funcionarios
            </NavLink>
          </nav>
        </div>
      </header>

      {/* Contenido */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Link
          to="/"
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-sky-700"
        >
          ← Volver al inicio
        </Link>
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        Municipalidad — DOM en Línea · Fase 4 (MVP)
      </footer>
    </div>
  );
}