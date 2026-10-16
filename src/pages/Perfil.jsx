import { Loader2, Mail, User } from "lucide-react";
import { useState } from "react";
import { api } from "../api/client";
import Input from "../components/Input";
import Mensaje from "../components/Mensaje";
import PasswordInput from "../components/PasswordInput";
import { useAuth } from "../context/AuthContext";

const botonClase =
  "flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-green-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-700/25 transition hover:shadow-emerald-700/40 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-8";

export default function Perfil() {
  const { usuario, getToken, actualizarUsuario } = useAuth();

  const [datos, setDatos] = useState({ nombre: usuario.nombre, correo: usuario.correo });
  const [msgDatos, setMsgDatos] = useState(null);
  const [guardandoDatos, setGuardandoDatos] = useState(false);

  const [pass, setPass] = useState({ actual: "", nueva: "", confirmar: "" });
  const [msgPass, setMsgPass] = useState(null);
  const [guardandoPass, setGuardandoPass] = useState(false);

  const iniciales = usuario.nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  const guardarDatos = async (e) => {
    e.preventDefault();
    setMsgDatos(null);
    if (datos.nombre.trim().length < 2) {
      return setMsgDatos({ tipo: "error", texto: "Escribe tu nombre completo" });
    }
    setGuardandoDatos(true);
    try {
      const nuevo = await api("/perfil", {
        method: "PUT",
        body: { nombre: datos.nombre.trim(), correo: datos.correo.trim() },
        token: getToken(),
      });
      actualizarUsuario(nuevo);
      setMsgDatos({ tipo: "ok", texto: "Datos actualizados correctamente" });
    } catch (err) {
      setMsgDatos({ tipo: "error", texto: err.message });
    } finally {
      setGuardandoDatos(false);
    }
  };

  const cambiarPassword = async (e) => {
    e.preventDefault();
    setMsgPass(null);
    if (pass.nueva !== pass.confirmar) {
      return setMsgPass({ tipo: "error", texto: "Las contraseñas nuevas no coinciden" });
    }
    setGuardandoPass(true);
    try {
      await api("/perfil/password", {
        method: "PUT",
        body: { actual: pass.actual, nueva: pass.nueva },
        token: getToken(),
      });
      setPass({ actual: "", nueva: "", confirmar: "" });
      setMsgPass({ tipo: "ok", texto: "Contraseña cambiada correctamente" });
    } catch (err) {
      setMsgPass({ tipo: "error", texto: err.message });
    } finally {
      setGuardandoPass(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-green-500 text-2xl font-bold text-white">
          {iniciales}
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-xl font-bold text-emerald-950">{usuario.nombre}</h2>
          <p className="truncate text-sm text-slate-500">{usuario.correo}</p>
          <span className="mt-1 inline-block rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold capitalize text-emerald-800">
            {usuario.rol}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={guardarDatos} className="space-y-4 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-lg font-semibold text-emerald-950">Datos personales</h3>
          <Input
            label="Nombre completo"
            icon={User}
            value={datos.nombre}
            onChange={(e) => setDatos({ ...datos, nombre: e.target.value })}
          />
          <Input
            label="Correo electrónico"
            icon={Mail}
            type="email"
            value={datos.correo}
            onChange={(e) => setDatos({ ...datos, correo: e.target.value })}
          />
          {msgDatos && <Mensaje tipo={msgDatos.tipo}>{msgDatos.texto}</Mensaje>}
          <button disabled={guardandoDatos} className={botonClase}>
            {guardandoDatos ? <Loader2 className="h-5 w-5 animate-spin" /> : "Guardar cambios"}
          </button>
        </form>

        <form onSubmit={cambiarPassword} className="space-y-4 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-lg font-semibold text-emerald-950">Cambiar contraseña</h3>
          <PasswordInput
            label="Contraseña actual"
            autoComplete="current-password"
            value={pass.actual}
            onChange={(e) => setPass({ ...pass, actual: e.target.value })}
          />
          <PasswordInput
            label="Nueva contraseña"
            autoComplete="new-password"
            mostrarFuerza
            value={pass.nueva}
            onChange={(e) => setPass({ ...pass, nueva: e.target.value })}
          />
          <PasswordInput
            label="Confirmar nueva contraseña"
            autoComplete="new-password"
            value={pass.confirmar}
            onChange={(e) => setPass({ ...pass, confirmar: e.target.value })}
          />
          {msgPass && <Mensaje tipo={msgPass.tipo}>{msgPass.texto}</Mensaje>}
          <button disabled={guardandoPass || !pass.actual || !pass.nueva} className={botonClase}>
            {guardandoPass ? <Loader2 className="h-5 w-5 animate-spin" /> : "Cambiar contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}