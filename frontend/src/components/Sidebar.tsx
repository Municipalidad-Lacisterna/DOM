import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface OpcionNav {
  to: string;
  label: string;
  icon: ReactNode;
}

const OPCIONES: OpcionNav[] = [
  {
    to: "/intranet/bandeja",
    label: "Bandeja de Entrada",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    ),
  },
  {
    to: "/intranet/aprobados",
    label: "Aprobados",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    to: "/intranet/configuracion",
    label: "Configuración",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const cerrarSesion = () => {
    logout();
    navigate("/");
  };

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-slate-900 text-slate-300">
      {/* Logo → portada del sistema */}
      <NavLink
        to="/"
        className="flex items-center gap-3 border-b border-slate-800 px-5 py-5 transition-colors hover:bg-slate-800"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-600 text-white">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">DOM Municipal</p>
          <p className="text-xs text-slate-400">Intranet Funcionarios</p>
        </div>
      </NavLink>

      {/* Navegación */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {OPCIONES.map((op) => (
          <NavLink
            key={op.to}
            to={op.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sky-600 text-white shadow"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <span aria-hidden>{op.icon}</span>
            {op.label}
          </NavLink>
        ))}
      </nav>

      {/* Usuario / salir */}
      <div className="border-t border-slate-800 px-3 py-4">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-sm font-bold text-white">
            F
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">Funcionario</p>
            <p className="truncate text-xs text-slate-400">Dirección de Obras</p>
          </div>
        </div>
        <button
          onClick={cerrarSesion}
          className="mt-3 w-full rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition-colors hover:border-red-500/50 hover:text-red-300"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}