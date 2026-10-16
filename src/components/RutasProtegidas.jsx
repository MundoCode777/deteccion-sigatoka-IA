import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingScreen from "./LoadingScreen";

export function RutaProtegida() {
  const { usuario, cargando } = useAuth();
  if (cargando) return <LoadingScreen mensaje="Verificando sesión..." />;
  return usuario ? <Outlet /> : <Navigate to="/login" replace />;
}

export function RutaPublica() {
  const { usuario, cargando } = useAuth();
  if (cargando) return <LoadingScreen mensaje="Verificando sesión..." />;
  return usuario ? <Navigate to="/" replace /> : <Outlet />;
}

// Solo deja pasar a quien tenga el permiso indicado
export function RutaPermiso({ permiso }) {
  const { tiene } = useAuth();
  return tiene(permiso) ? <Outlet /> : <Navigate to="/" replace />;
}