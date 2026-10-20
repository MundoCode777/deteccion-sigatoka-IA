import { AnimatePresence, motion } from "framer-motion";
import { Leaf, LayoutDashboard, MapPin, ShieldCheck, User, Users, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// Aquí se irán sumando los demás módulos
const MENU = [
  { to: "/", texto: "Inicio", icon: LayoutDashboard },
  { to: "/lotes", texto: "Lotes", icon: MapPin, permiso: "lotes.ver" },
  { to: "/admin/usuarios", texto: "Usuarios", icon: Users, permiso: "usuarios.ver" },
  { to: "/admin/roles", texto: "Roles y permisos", icon: ShieldCheck, permiso: "roles.gestionar" },
  { to: "/perfil", texto: "Mi perfil", icon: User },
];

export default function Sidebar({ colapsado, abierto, onCerrar }) {
  const { tiene } = useAuth();
  const items = MENU.filter((i) => !i.permiso || tiene(i.permiso));
  const ocultar = colapsado ? "lg:hidden" : "";

  return (
    <>
      {/* Fondo oscuro en móvil */}
      <AnimatePresence>
        {abierto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCerrar}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-gradient-to-b from-emerald-950 via-emerald-900 to-green-900 text-white shadow-2xl transition-all duration-300 lg:static lg:translate-x-0 lg:shadow-none ${
          abierto ? "translate-x-0" : "-translate-x-full"
        } ${colapsado ? "lg:w-20" : "lg:w-64"}`}
      >
        <div className={`flex h-16 items-center justify-between px-5 ${colapsado ? "lg:justify-center lg:px-0" : ""}`}>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-yellow-300 p-2 text-emerald-900">
              <Leaf className="h-5 w-5" />
            </div>
            <span className={`text-sm font-semibold leading-tight ${ocultar}`}>
              Hacienda
              <br />
              San Luis
            </span>
          </div>
          <button
            onClick={onCerrar}
            className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 lg:hidden"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-4 flex-1 space-y-1.5 overflow-y-auto px-3">
          {items.map(({ to, texto, icon: Icono }) => (
            <NavLink
              key={to}
              to={to}
              end
              title={texto}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all ${
                  colapsado ? "lg:justify-center lg:px-0" : ""
                } ${
                  isActive
                    ? "bg-white/15 text-yellow-300 shadow-inner"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <Icono className="h-5 w-5 shrink-0" />
              <span className={ocultar}>{texto}</span>
            </NavLink>
          ))}
        </nav>

        <p className={`px-5 py-4 text-xs text-white/50 ${ocultar}`}>Detección de Sigatoka Negra</p>
      </aside>
    </>
  );
}