import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const OPCIONES = [
  { to: "/intranet/bandeja", label: "Bandeja de Entrada", icon: "📥" },
  { to: "/intranet/aprobados", label: "Aprobados", icon: "✅" },
  { to: "/intranet/configuracion", label: "Configuración", icon: "⚙️" },
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
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-slate-800 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-600 text-lg text-white">
          🏛️
        </div>
        <div>
          <p className="text-sm font-semibold text-white">DOM Municipal</p>
          <p className="text-xs text-slate-400">Intranet Funcionarios</p>
        </div>
      </div>

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