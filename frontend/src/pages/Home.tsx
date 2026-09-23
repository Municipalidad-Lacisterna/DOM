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
            <span className="text-xl">🏛️</span>
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
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-2xl">
              👤
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
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-2xl">
              📋
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
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-2xl">
              🧑‍💼
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