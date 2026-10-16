import { motion } from "framer-motion";
import { Leaf } from "lucide-react";

export default function Cargando({ texto = "Cargando..." }) {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center gap-4">
      <motion.div
        animate={{ rotate: [0, 14, -14, 0], scale: [1, 1.12, 1] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        className="rounded-3xl bg-emerald-100 p-5 text-emerald-700"
      >
        <Leaf className="h-9 w-9" />
      </motion.div>
      <p className="animate-pulse text-sm font-medium text-emerald-900/70">{texto}</p>
    </div>
  );
}