import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, User, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ACCESOS = [
  { to: "/admin/usuarios", titulo: "Usuarios", desc: "Asigna roles a las cuentas", icon: Users, permiso: "usuarios.ver" },
  { to: "/admin/roles", titulo: "Roles y permisos", desc: "Crea roles y configura permisos", icon: ShieldCheck, permiso: "roles.gestionar" },
  { to: "/perfil", titulo: "Mi perfil", desc: "Edita tus datos y contraseña", icon: User },
];

export default function Dashboard() {
  const { usuario, tiene } = useAuth();
  const accesos = ACCESOS.filter((a) => !a.permiso || tiene(a.permiso));

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-green-700 to-lime-600 p-6 text-white shadow-lg sm:p-8">
        <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-yellow-300/20 blur-2xl" />
        <p className="text-sm text-white/80">Bienvenido</p>
        <h2 className="mt-1 text-2xl font-bold sm:text-3xl">Hola, {usuario.nombre.split(" ")[0]} 🍌</h2>
        <p className="mt-2 max-w-xl text-sm text-white/85">
          Tu rol es <span className="font-semibold capitalize text-yellow-300">{usuario.rol}</span>. Desde aquí
          podrás detectar la Sigatoka Negra, registrar tratamientos y dar seguimiento a cada lote.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accesos.map(({ to, titulo, desc, icon: Icono }, i) => (
          <motion.div
            key={to}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Link
              to={to}
              className="group flex h-full items-center gap-4 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <span className="rounded-xl bg-emerald-100 p-3 text-emerald-700 transition group-hover:bg-emerald-600 group-hover:text-white">
                <Icono className="h-6 w-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-emerald-950">{titulo}</span>
                <span className="block text-sm text-slate-500">{desc}</span>
              </span>
              <ArrowRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-600" />
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}