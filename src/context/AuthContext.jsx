import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      setCargando(false);
      return;
    }
    api("/auth/me", { token })
      .then(setUsuario)
      .catch(() => sessionStorage.removeItem("token"))
      .finally(() => setCargando(false));
  }, []);

  const guardarSesion = (data) => {
    sessionStorage.setItem("token", data.access_token);
    setUsuario(data.usuario);
  };

  const login = async (correo, password) =>
    guardarSesion(await api("/auth/login", { method: "POST", body: { correo, password } }));

  const registrar = async (nombre, correo, password) =>
    guardarSesion(await api("/auth/registro", { method: "POST", body: { nombre, correo, password } }));

  const logout = () => {
    sessionStorage.removeItem("token");
    setUsuario(null);
  };

  const getToken = () => sessionStorage.getItem("token");

  const tiene = (permiso) => !!usuario?.permisos?.includes(permiso);

  const actualizarUsuario = (datos) => setUsuario(datos);

  return (
    <AuthContext.Provider
      value={{ usuario, cargando, login, registrar, logout, getToken, tiene, actualizarUsuario }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);