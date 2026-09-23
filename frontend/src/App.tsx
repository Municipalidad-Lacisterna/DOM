import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import LayoutCiudadano from "./layouts/LayoutCiudadano";
import LayoutIntranet from "./layouts/LayoutIntranet";
import Home from "./pages/Home";
import Login from "./pages/Login";
import NuevoTramite from "./pages/ciudadano/NuevoTramite";
import ConsultarEstado from "./pages/ciudadano/ConsultarEstado";
import Aprobados from "./pages/intranet/Aprobados";
import BandejaEntrada from "./pages/intranet/BandejaEntrada";
import Configuracion from "./pages/intranet/Configuracion";
import RevisarTramite from "./pages/intranet/RevisarTramite";

export default function App() {
  return (
    <Routes>
      {/* Público */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Navigate to="/login/funcionarios" replace />} />
      <Route path="/login/funcionarios" element={<Login />} />
      <Route path="/estado" element={<ConsultarEstado />} />

      {/* ── Portal Ciudadano (PÚBLICO, sin login) ──────────────────── */}
      <Route path="/ciudadano" element={<LayoutCiudadano />}>
        <Route index element={<Navigate to="nuevo-tramite" replace />} />
        <Route path="nuevo-tramite" element={<NuevoTramite />} />
      </Route>

      {/* ── Intranet Funcionarios (requiere sesión JWT) ────────────── */}
      <Route element={<ProtectedRoute />}>
        <Route path="/intranet" element={<LayoutIntranet />}>
          <Route index element={<Navigate to="bandeja" replace />} />
          <Route path="bandeja" element={<BandejaEntrada />} />
          <Route path="aprobados" element={<Aprobados />} />
          <Route path="configuracion" element={<Configuracion />} />
          <Route path="solicitudes/:id" element={<RevisarTramite />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}