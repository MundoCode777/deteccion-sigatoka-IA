import { Leaf } from "lucide-react";
import { motion } from "framer-motion";

export default function LoadingScreen({ mensaje = "Cargando..." }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-emerald-900 via-green-800 to-lime-700">
      <motion.div
        animate={{ rotate: [0, 12, -12, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="rounded-3xl bg-white/15 p-6 backdrop-blur"
      >
        <Leaf className="h-12 w-12 text-yellow-300" />
      </motion.div>
      <p className="mt-6 animate-pulse text-sm font-medium tracking-wide text-white/90">{mensaje}</p>
    </div>
  );
}