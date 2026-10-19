import { BarChart3, Leaf, MapPin, ScanLine } from "lucide-react";
import { motion } from "framer-motion";

function Hoja({ className, style }) {
  return (
    <svg viewBox="0 0 200 130" className={className} style={style} fill="none">
      <path d="M0 105 C20 25 120 0 200 10 C180 90 90 135 0 105 Z" fill="currentColor" />
      <path d="M0 105 C60 70 130 40 200 10" stroke="white" strokeOpacity="0.35" strokeWidth="2" />
    </svg>
  );
}

const caracteristicas = [
  { icon: ScanLine, texto: "Detección con inteligencia artificial" },
  { icon: MapPin, texto: "Monitoreo por lote y ubicación" },
  { icon: BarChart3, texto: "Seguimiento y reportes de severidad" },
];

export default function AuthLayout({ titulo, subtitulo, children }) {
  return (
    <div className="flex min-h-screen">
      {/* Panel izquierdo (solo escritorio) */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-emerald-900 via-green-800 to-lime-700 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Hoja className="absolute -left-10 top-10 h-44 w-72 animate-float text-emerald-500/30" />
        <Hoja className="absolute -right-16 top-1/3 h-52 w-80 rotate-12 animate-float-slow text-lime-400/20" />
        <Hoja className="absolute -bottom-10 left-1/4 h-44 w-72 -rotate-12 animate-sway text-green-300/20" />
        <div className="absolute right-20 top-24 h-24 w-24 animate-float-slow rounded-full bg-yellow-300/20 blur-2xl" />

        <div className="relative flex items-center gap-3 text-white">
          <div className="rounded-2xl bg-yellow-300 p-2.5 text-emerald-900">
            <Leaf className="h-6 w-6" />
          </div>
          <span className="text-lg font-semibold">Hacienda San Luis</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative text-white"
        >
          <h1 className="text-4xl font-bold leading-tight xl:text-5xl">
            Protege tu banano de la <span className="text-yellow-300">Sigatoka Negra</span>
          </h1>
          <p className="mt-4 max-w-md text-white/80">
            Detecta la enfermedad a tiempo, registra tratamientos y da seguimiento a cada lote desde un solo lugar.
          </p>
          <ul className="mt-8 space-y-4">
            {caracteristicas.map(({ icon: Icon, texto }, i) => (
              <motion.li
                key={texto}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.15 }}
                className="flex items-center gap-3"
              >
                <span className="rounded-xl bg-white/15 p-2 backdrop-blur">
                  <Icon className="h-5 w-5 text-yellow-300" />
                </span>
                <span className="text-sm text-white/90">{texto}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        <p className="relative text-xs text-white/60">Sistema de detección y monitoreo de enfermedades en banano</p>
      </div>

      {/* Panel derecho: formulario */}
      <div className="flex w-full items-center justify-center px-5 py-10 lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="rounded-2xl bg-emerald-700 p-2.5 text-yellow-300">
              <Leaf className="h-6 w-6" />
            </div>
            <span className="font-semibold text-emerald-900">Hacienda San Luis</span>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-white p-7 shadow-xl shadow-emerald-900/5 sm:p-9">
            <h2 className="text-2xl font-bold text-emerald-950">{titulo}</h2>
            <p className="mt-1 text-sm text-slate-500">{subtitulo}</p>
            <div className="mt-7">{children}</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}