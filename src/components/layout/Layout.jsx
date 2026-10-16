import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Cargando from "../Cargando";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout() {
  const { pathname } = useLocation();
  const [colapsado, setColapsado] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [cambiando, setCambiando] = useState(true);

  // Al cambiar de módulo: cierra el menú móvil y muestra una breve pantalla de carga
  useEffect(() => {
    setAbierto(false);
    setCambiando(true);
    const t = setTimeout(() => setCambiando(false), 450);
    return () => clearTimeout(t);
  }, [pathname]);

  // Cerrar el menú móvil con Escape
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setAbierto(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-emerald-50">
      <Sidebar colapsado={colapsado} abierto={abierto} onCerrar={() => setAbierto(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          colapsado={colapsado}
          onMenuMovil={() => setAbierto(true)}
          onToggleColapso={() => setColapsado(!colapsado)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {cambiando ? (
            <Cargando />
          ) : (
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mx-auto max-w-6xl"
            >
              <Outlet />
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}