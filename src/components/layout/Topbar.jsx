import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, LogOut, Menu, PanelLeftClose, PanelLeftOpen, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const TITULOS = {
  "/": "Inicio",
  "/perfil": "Mi perfil",
  "/admin/usuarios": "Usuarios",
  "/admin/roles": "Roles y permisos",
};

export default function Topbar({ colapsado, onMenuMovil, onToggleColapso }) {
  const { usuario, logout } = useAuth();
  const { pathname } = useLocation();
  const [menu, setMenu] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const cerrarFuera = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setMenu(false);
    };
    document.addEventListener("mousedown", cerrarFuera);
    return () => document.removeEventListener("mousedown", cerrarFuera);
  }, []);

  useEffect(() => setMenu(false), [pathname]);

  const iniciales = usuario.nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-emerald-100 bg-white/80 px-4 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          onClick={onMenuMovil}
          className="rounded-xl p-2 text-emerald-900 transition hover:bg-emerald-50 lg:hidden"
          aria-label="Abrir menú"
        >
          <Menu className="h-6 w-6" />
        </button>

        <button
          onClick={onToggleColapso}
          className="hidden rounded-xl p-2 text-emerald-900 transition hover:bg-emerald-50 lg:block"
          aria-label={colapsado ? "Expandir menú" : "Colapsar menú"}
        >
          {colapsado ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </button>

        <h1 className="truncate text-base font-semibold text-emerald-950 sm:text-lg">
          {TITULOS[pathname] ?? "Sigatoka Negra"}
        </h1>
      </div>

      <div className="relative" ref={ref}>
        <button
          onClick={() => setMenu(!menu)}
          className="flex items-center gap-2.5 rounded-2xl p-1.5 pr-2 transition hover:bg-emerald-50 sm:pr-3"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-green-500 text-sm font-bold text-white">
            {iniciales}
          </span>
          <span className="hidden text-left sm:block">
            <span className="block max-w-[140px] truncate text-sm font-semibold leading-tight text-emerald-950">
              {usuario.nombre}
            </span>
            <span className="block text-xs capitalize text-slate-500">{usuario.rol}</span>
          </span>
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${menu ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {menu && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-xl"
            >
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="truncate text-sm font-semibold text-emerald-950">{usuario.nombre}</p>
                <p className="truncate text-xs text-slate-500">{usuario.correo}</p>
              </div>
              <div className="p-1.5">
                <Link
                  to="/perfil"
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-emerald-50"
                >
                  <User className="h-4 w-4" /> Mi perfil
                </Link>
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" /> Cerrar sesión
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}