import { Loader2, MapPin, Search } from "lucide-react";
import { useState } from "react";
import { buscarDireccion } from "../../utils/buscarDireccion";

// No usa <form> porque se coloca dentro de otro formulario
export default function BuscadorDireccion({ onElegir }) {
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState(null); // null = aún no se busca
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState("");

  const buscar = async () => {
    const consulta = texto.trim();
    if (consulta.length < 3) return setError("Escribe al menos 3 letras");

    setError("");
    setBuscando(true);
    try {
      setResultados(await buscarDireccion(consulta));
    } catch (err) {
      setResultados(null);
      setError(err.message);
    } finally {
      setBuscando(false);
    }
  };

  const elegir = (r) => {
    onElegir(r);
    setResultados(null);
    setTexto(r.nombre.split(",").slice(0, 2).join(",").trim());
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="group relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-emerald-600" />
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                buscar();
              }
            }}
            placeholder="Buscar dirección o lugar (ej: Milagro, vía a Naranjito)"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
          />
        </div>
        <button
          type="button"
          onClick={buscar}
          disabled={buscando}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
        >
          {buscando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {resultados && (
        <div className="max-h-48 overflow-y-auto rounded-xl border border-emerald-100 bg-white shadow-sm">
          {resultados.length === 0 ? (
            <p className="p-3 text-sm text-slate-500">
              Sin resultados. Prueba con el nombre del pueblo o la vía principal.
            </p>
          ) : (
            resultados.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => elegir(r)}
                className="flex w-full items-start gap-2.5 border-b border-slate-100 px-3 py-2.5 text-left text-sm text-slate-700 transition last:border-0 hover:bg-emerald-50"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{r.nombre}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}