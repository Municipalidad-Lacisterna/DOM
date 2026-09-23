import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LayoutCiudadano from "./layouts/LayoutCiudadano";
import NuevoTramite from "./pages/ciudadano/NuevoTramite";
import ConsultarEstado from "./pages/ciudadano/ConsultarEstado";
import "./index.css";

/**
 * Entrada AISLADA del Portal Ciudadano (puerto aparte, ver ciudadano.html).
 * Todo es PÚBLICO: el ciudadano no inicia sesión, su trámite se controla
 * por folio en /estado.
 */
export default function AppCiudadano() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/ciudadano" replace />} />
      <Route path="/estado" element={<ConsultarEstado />} />
      <Route path="/ciudadano" element={<LayoutCiudadano />}>
        <Route index element={<Navigate to="nuevo-tramite" replace />} />
        <Route path="nuevo-tramite" element={<NuevoTramite />} />
      </Route>
      <Route path="*" element={<Navigate to="/ciudadano" replace />} />
    </Routes>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AppCiudadano />
    </BrowserRouter>
  </StrictMode>,
);