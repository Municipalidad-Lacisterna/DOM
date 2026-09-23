import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

/**
 * Shell de la Intranet: sidebar fijo a la izquierda + área de contenido.
 */
export default function LayoutIntranet() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar fija (ocultable en móvil en una fase posterior) */}
      <div className="max-md:hidden">
        <Sidebar />
      </div>

      {/* Contenido */}
      <main className="min-w-0 flex-1 p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}