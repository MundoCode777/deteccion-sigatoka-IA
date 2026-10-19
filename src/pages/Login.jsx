import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import Input from "../components/Input";
import PasswordInput from "../components/PasswordInput";
import { useAuth } from "../context/AuthContext";
import { alertaOk } from "../utils/alertas";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      await login(correo.trim(), password);
      alertaOk("¡Bienvenido!", "Iniciaste sesión correctamente");
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <AuthLayout titulo="Bienvenido de nuevo" subtitulo="Ingresa para continuar con el monitoreo de tus lotes">
      <form onSubmit={enviar} className="space-y-5" noValidate>
        <Input
          label="Correo electrónico"
          icon={Mail}
          type="email"
          placeholder="tucorreo@ejemplo.com"
          autoComplete="email"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          required
        />
        <PasswordInput
          label="Contraseña"
          placeholder="••••••••"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
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
          disabled={enviando || !correo || !password}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-green-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-700/25 transition hover:shadow-emerald-700/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {enviando ? <Loader2 className="h-5 w-5 animate-spin" /> : "Iniciar sesión"}
        </motion.button>

        <p className="text-center text-sm text-slate-500">
          ¿No tienes cuenta?{" "}
          <Link to="/registro" className="font-semibold text-emerald-700 hover:underline">
            Regístrate
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}