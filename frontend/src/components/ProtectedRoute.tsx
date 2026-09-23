import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/**
 * Barrera de la intranet: sin sesión de funcionario → login de
 * funcionarios recordando la ruta de origen.
 */
export default function ProtectedRoute() {
  const { rol } = useAuth();
  const location = useLocation();

  if (rol !== "funcionario") {
    return (
      <Navigate to="/login/funcionarios" replace state={{ desde: location.pathname }} />
    );
  }

  return <Outlet />;
}