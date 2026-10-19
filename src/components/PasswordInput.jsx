import { Eye, EyeOff, Lock } from "lucide-react";
import { useState } from "react";

function nivelFuerza(p) {
  let n = 0;
  if (p.length >= 8) n++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) n++;
  if (/\d/.test(p)) n++;
  if (/[^A-Za-z0-9]/.test(p)) n++;
  return n;
}

const colores = ["bg-slate-200", "bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-emerald-500"];
const textos = ["", "Débil", "Regular", "Buena", "Fuerte"];

export default function PasswordInput({ label, mostrarFuerza = false, value, ...props }) {
  const [ver, setVer] = useState(false);
  const fuerza = nivelFuerza(value || "");

  return (
    <div>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-600">{label}</span>
        <div className="group relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-emerald-600" />
          <input
            {...props}
            value={value}
            type={ver ? "text" : "password"}
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-11 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
          />
          <button
            type="button"
            onClick={() => setVer(!ver)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600"
            aria-label={ver ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {ver ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </label>

      {mostrarFuerza && value && (
        <div className="mt-2">
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  i <= fuerza ? colores[fuerza] : "bg-slate-200"
                }`}
              />
            ))}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Seguridad: <span className="font-medium">{textos[fuerza]}</span>
          </p>
        </div>
      )}
    </div>
  );
}