import { motion } from "framer-motion";
import { Loader2, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../api/client";
import Cargando from "../../components/Cargando";
import Mensaje from "../../components/Mensaje";
import { useAuth } from "../../context/AuthContext";
import { alertaError, alertaOk, confirmar } from "../../utils/alertas";

const iniciales = (nombre) =>
  nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

export default function Usuarios() {
  const { usuario, getToken, tiene } = useAuth();
  const [lista, setLista] = useState([]);
  const [roles, setRoles] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(null);
  const [errorCarga, setErrorCarga] = useState("");

  const puedeAsignar = tiene("usuarios.asignar_rol");

  useEffect(() => {
    const token = getToken();
    Promise.all([api("/usuarios", { token }), api("/roles", { token })])
      .then(([u, r]) => {
        setLista(u);
        setRoles(r);
      })
      .catch((err) => setErrorCarga(err.message))
      .finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cambiarRol = async (u, rol) => {
    if (rol === u.rol) return;

    const aceptar = await confirmar({
      titulo: "¿Cambiar el rol?",
      texto: `${u.nombre} pasará de "${u.rol}" a "${rol}".`,
      textoConfirmar: "Sí, cambiar",
    });
    if (!aceptar) return;

    setGuardando(u.id);
    try {
      await api(`/usuarios/${u.id}/rol`, { method: "PUT", body: { rol }, token: getToken() });
      setLista((l) => l.map((x) => (x.id === u.id ? { ...x, rol } : x)));
      alertaOk("Rol actualizado", `${u.nombre} ahora es "${rol}"`);
    } catch (err) {
      alertaError("No se pudo cambiar el rol", err.message);
    } finally {
      setGuardando(null);
    }
  };

  const filtrados = lista.filter((u) =>
    `${u.nombre} ${u.correo}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (cargando) return <Cargando texto="Cargando usuarios..." />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-emerald-950">Usuarios registrados</h2>
          <p className="text-sm text-slate-500">{lista.length} cuentas en el sistema</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o correo"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
          />
        </div>
      </div>

      {errorCarga && <Mensaje tipo="error">{errorCarga}</Mensaje>}

      <div className="space-y-3">
        {filtrados.map((u, i) => {
          const esYo = u.id === usuario.id;
          return (
            <motion.div
              key={u.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.4) }}
              className="flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-sm font-bold text-emerald-800">
                  {iniciales(u.nombre)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-emerald-950">
                    {u.nombre} {esYo && <span className="text-xs font-normal text-slate-400">(tú)</span>}
                  </p>
                  <p className="truncate text-sm text-slate-500">{u.correo}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {guardando === u.id && <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />}
                <select
                  value={u.rol}
                  disabled={esYo || !puedeAsignar || guardando === u.id}
                  onChange={(e) => cambiarRol(u, e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm capitalize outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 sm:w-48"
                >
                  {roles.map((r) => (
                    <option key={r.nombre} value={r.nombre}>
                      {r.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </motion.div>
          );
        })}

        {filtrados.length === 0 && (
          <p className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500">
            No se encontraron usuarios.
          </p>
        )}
      </div>
    </div>
  );
}