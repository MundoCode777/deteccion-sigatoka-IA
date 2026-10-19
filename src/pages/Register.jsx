import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Loader2, Mail, User } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import Input from "../components/Input";
import PasswordInput from "../components/PasswordInput";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { registrar } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: "", correo: "", password: "", confirmar: "" });
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const validar = () => {
    if (form.nombre.trim().length < 2) return "Escribe tu nombre completo";
    if (form.password.length < 8) return "La contraseña debe tener al menos 8 caracteres";
    if (!/[A-Z]/.test(form.password) || !/[a-z]/.test(form.password) || !/\d/.test(form.password))
      return "La contraseña debe tener mayúscula, minúscula y número";
    if (form.password !== form.confirmar) return "Las contraseñas no coinciden";
    return "";
  };

  const enviar = async (e) => {
    e.preventDefault();
    const msg = validar();
    if (msg) return setError(msg);

    setError("");
    setEnviando(true);
    try {
      await registrar(form.nombre.trim(), form.correo.trim(), form.password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <AuthLayout titulo="Crea tu cuenta" subtitulo="Tu rol será asignado por un administrador">
      <form onSubmit={enviar} className="space-y-4" noValidate>
        <Input
          label="Nombre completo"
          icon={User}
          placeholder="Juan Pérez"
          autoComplete="name"
          value={form.nombre}
          onChange={cambiar("nombre")}
        />
        <Input
          label="Correo electrónico"
          icon={Mail}
          type="email"
          placeholder="tucorreo@ejemplo.com"
          autoComplete="email"
          value={form.correo}
          onChange={cambiar("correo")}
        />
        <PasswordInput
          label="Contraseña"
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
          mostrarFuerza
          value={form.password}
          onChange={cambiar("password")}
        />
        <PasswordInput
          label="Confirmar contraseña"
          placeholder="Repite la contraseña"
          autoComplete="new-password"
          value={form.confirmar}
          onChange={cambiar("confirmar")}
        />

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: [0, -6, 6, -4, 4, 0] }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileTap={{ scale: 0.98 }}
          disabled={enviando}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-green-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-700/25 transition hover:shadow-emerald-700/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {enviando ? <Loader2 className="h-5 w-5 animate-spin" /> : "Crear cuenta"}
        </motion.button>

        <p className="text-center text-sm text-slate-500">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="font-semibold text-emerald-700 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}