import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout";
import { RutaPermiso, RutaProtegida, RutaPublica } from "./components/RutasProtegidas";
import Roles from "./pages/admin/Roles";
import Usuarios from "./pages/admin/Usuarios";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Lotes from "./pages/Lotes";
import Perfil from "./pages/Perfil";
import Register from "./pages/Register";

export default function App() {
  return (
    <Routes>
      <Route element={<RutaPublica />}>
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Register />} />
      </Route>

      <Route element={<RutaProtegida />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/perfil" element={<Perfil />} />

          <Route element={<RutaPermiso permiso="lotes.ver" />}>
            <Route path="/lotes" element={<Lotes />} />
          </Route>

          <Route element={<RutaPermiso permiso="usuarios.ver" />}>
            <Route path="/admin/usuarios" element={<Usuarios />} />
          </Route>

          <Route element={<RutaPermiso permiso="roles.gestionar" />}>
            <Route path="/admin/roles" element={<Roles />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}