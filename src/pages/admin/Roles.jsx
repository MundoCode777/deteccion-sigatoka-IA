import { motion } from "framer-motion";
import { Loader2, Lock, Plus, Save, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../api/client";
import Cargando from "../../components/Cargando";
import Mensaje from "../../components/Mensaje";
import { useAuth } from "../../context/AuthContext";

const GRUPOS = {
  usuarios: "Usuarios",
  roles: "Roles",
  lotes: "Lotes",
  detecciones: "Detecciones",
  tratamientos: "Tratamientos",
  informes: "Informes",
};

export default function Roles() {
  const { usuario, getToken, actualizarUsuario } = useAuth();
  const [roles, setRoles] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [sel, setSel] = useState(null); // { original, nombre, permisos }
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState(null);

  const cargarRoles = async () => setRoles(await api("/roles", { token: getToken() }));

  useEffect(() => {
    const token = getToken();
    Promise.all([api("/roles", { token }), api("/roles/permisos", { token })])
      .then(([r, p]) => {
        setRoles(r);
        setCatalogo(p);
      })
      .catch((err) => setMsg({ tipo: "error", texto: err.message }))
      .finally(() => setCargando(false));
  }, []);

  const seleccionar = (r) => {
    setMsg(null);
    setSel({ original: r.nombre, nombre: r.nombre, permisos: [...r.permisos] });
  };

  const nuevoRol = () => {
    setMsg(null);
    setSel({ original: null, nombre: "", permisos: [] });
  };

  const alternar = (clave) =>
    setSel((s) => ({
      ...s,
      permisos: s.permisos.includes(clave) ? s.permisos.filter((p) => p !== clave) : [...s.permisos, clave],
    }));

  const guardar = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (sel.nombre.trim().length < 3) {
      return setMsg({ tipo: "error", texto: "El nombre del rol debe tener al menos 3 caracteres" });
    }
    setGuardando(true);
    try {
      const token = getToken();
      const esNuevo = !sel.original;
      const res = await api(esNuevo ? "/roles" : `/roles/${encodeURIComponent(sel.original)}`, {
        method: esNuevo ? "POST" : "PUT",
        body: { nombre: sel.nombre.trim(), permisos: sel.permisos },
        token,
      });
      await cargarRoles();
      actualizarUsuario(await api("/auth/me", { token })); // por si cambió tus propios permisos
      seleccionar(res);
      setMsg({ tipo: "ok", texto: esNuevo ? "Rol creado correctamente" : "Rol actualizado correctamente" });
    } catch (err) {
      setMsg({ tipo: "error", texto: err.message });
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return <Cargando texto="Cargando roles..." />;

  const esAdmin = sel?.original === "admin";
  const nombreFijo = sel?.original === "admin" || sel?.original === "tecnico";

  const grupos = catalogo.reduce((acc, p) => {
    const g = p.clave.split(".")[0];
    (acc[g] ||= []).push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-emerald-950">Roles y permisos</h2>
        <p className="text-sm text-slate-500">Define qué puede hacer cada rol dentro del sistema</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Lista de roles */}
        <div className="space-y-2.5">
          <button
            onClick={nuevoRol}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-300 bg-white py-3 text-sm font-semibold text-emerald-700 transition hover:border-emerald-500 hover:bg-emerald-50"
          >
            <Plus className="h-4 w-4" /> Nuevo rol
          </button>

          {roles.map((r) => (
            <button
              key={r.nombre}
              onClick={() => seleccionar(r)}
              className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${
                sel?.original === r.nombre
                  ? "border-emerald-500 bg-emerald-50 shadow-sm"
                  : "border-emerald-100 bg-white hover:border-emerald-300"
              }`}
            >
              <span className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                {r.nombre === "admin" ? <Lock className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-semibold capitalize text-emerald-950">{r.nombre}</span>
                <span className="block text-xs text-slate-500">{r.permisos.length} permisos</span>
              </span>
            </button>
          ))}
        </div>

        {/* Editor */}
        <div className="lg:col-span-2">
          {!sel ? (
            <div className="flex h-full min-h-[240px] items-center justify-center rounded-3xl border border-dashed border-emerald-200 bg-white/60 p-8 text-center text-sm text-slate-500">
              Selecciona un rol de la lista o crea uno nuevo.
            </div>
          ) : (
            <motion.form
              key={sel.original ?? "nuevo"}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={guardar}
              className="space-y-5 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6"
            >
              <h3 className="text-lg font-semibold text-emerald-950">
                {sel.original ? `Editar rol: ${sel.original}` : "Crear nuevo rol"}
              </h3>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-600">Nombre del rol</span>
                <input
                  value={sel.nombre}
                  disabled={nombreFijo}
                  onChange={(e) => setSel({ ...sel, nombre: e.target.value })}
                  placeholder="Ej: supervisor"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 disabled:bg-slate-50 disabled:text-slate-500"
                />
              </label>

              {esAdmin && (
                <Mensaje tipo="ok">El rol admin tiene todos los permisos y no se puede modificar.</Mensaje>
              )}

              <div className="space-y-4">
                {Object.entries(grupos).map(([g, items]) => (
                  <div key={g}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {GRUPOS[g] ?? g}
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {items.map((p) => (
                        <label
                          key={p.clave}
                          className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 text-sm transition ${
                            sel.permisos.includes(p.clave)
                              ? "border-emerald-400 bg-emerald-50 text-emerald-900"
                              : "border-slate-200 text-slate-600 hover:border-emerald-300"
                          } ${esAdmin ? "cursor-not-allowed opacity-70" : ""}`}
                        >
                          <input
                            type="checkbox"
                            disabled={esAdmin}
                            checked={sel.permisos.includes(p.clave)}
                            onChange={() => alternar(p.clave)}
                            className="h-4 w-4 accent-emerald-600"
                          />
                          {p.nombre}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {msg && <Mensaje tipo={msg.tipo}>{msg.texto}</Mensaje>}

              {!esAdmin && (
                <button
                  disabled={guardando}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-green-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-700/25 transition hover:shadow-emerald-700/40 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-8"
                >
                  {guardando ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Save className="h-4 w-4" /> Guardar rol
                    </>
                  )}
                </button>
              )}
            </motion.form>
          )}
        </div>
      </div>
    </div>
  );
}