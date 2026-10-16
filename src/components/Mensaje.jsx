import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function Mensaje({ tipo = "error", children }) {
  const ok = tipo === "ok";
  const Icono = ok ? CheckCircle2 : AlertCircle;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0, x: ok ? 0 : [0, -6, 6, -4, 4, 0] }}
      className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${
        ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"
      }`}
      role={ok ? "status" : "alert"}
    >
      <Icono className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </motion.div>
  );
}