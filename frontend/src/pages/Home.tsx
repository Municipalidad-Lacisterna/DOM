import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Home() {
  const { rol, funcionario, logout } = useAuth();
  const navigate = useNavigate();

  const entrarFuncionarios = () => {
    if (rol === "funcionario") navigate("/intranet");
    else navigate("/login/funcionarios", { state: { desde: "/intranet" } });
  };

  const cerrarSesion = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-sky-50">
      {/* Navbar */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <svg className="h-6 w-6 text-sky-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="font-semibold text-slate-900">DOM en Línea Municipal</span>
          </div>
          {rol === "funcionario" && funcionario && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-600">
                {funcionario.departamento} · {funcionario.rut}
              </span>
              <button
                type="button"
                onClick={cerrarSesion}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:border-red-400 hover:text-red-500"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-16">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
            Trámites de la Dirección de Obras,
            <br />
            <span className="text-sky-600">sin salir de casa.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-slate-600">
            Ingrese sus solicitudes, adjunte los planos y haga seguimiento del estado de sus
            trámites municipales en línea.
          </p>
        </div>

        {/* Tarjetas de acceso */}
        <div className="grid gap-6 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => navigate("/ciudadano")}
            className="group rounded-2xl border border-slate-200 bg-white p-8 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-sky-300 hover:shadow-lg"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900">Portal Ciudadano</h2>
            <p className="mt-1 text-sm text-slate-500">
              Ingrese un nuevo trámite y adjunte la documentación requerida.
            </p>
            <span className="mt-4 inline-block text-sm font-semibold text-sky-600 group-hover:underline">
              Ingresar al portal →
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/estado")}
            className="group rounded-2xl border border-slate-200 bg-white p-8 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900">Consultar estado</h2>
            <p className="mt-1 text-sm text-slate-500">
              Ingrese su folio (ej. DOM-2026-001) para ver el avance de su trámite.
            </p>
            <span className="mt-4 inline-block text-sm font-semibold text-emerald-600 group-hover:underline">
              Consultar mi trámite →
            </span>
          </button>

          <button
            type="button"
            onClick={entrarFuncionarios}
            className="group rounded-2xl border border-slate-200 bg-white p-8 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-slate-500 hover:shadow-lg"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900">Intranet Funcionarios</h2>
            <p className="mt-1 text-sm text-slate-500">
              Bandeja de trámites, revisión y aprobación de solicitudes.
            </p>
            <span className="mt-4 inline-block text-sm font-semibold text-slate-700 group-hover:underline">
              Acceder a la intranet →
            </span>
          </button>
        </div>
      </main>
    </div>
  );
}