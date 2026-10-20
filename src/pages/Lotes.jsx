import { motion } from "framer-motion";
import { MapPin, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../api/client";
import Cargando from "../components/Cargando";
import BuscadorDireccion from "../components/lotes/BuscadorDireccion";
import FormularioLote from "../components/lotes/FormularioLote";
import MapaLotes from "../components/lotes/MapaLotes";
import Mensaje from "../components/Mensaje";
import { useAuth } from "../context/AuthContext";
import { alertaError, alertaOk, confirmar } from "../utils/alertas";
import { formatoHa } from "../utils/geo";

const fechaCorta = (iso) =>
  new Date(iso).toLocaleDateString("es-EC", { day: "2-digit", month: "short", year: "numeric" });

export default function Lotes() {
  const { getToken, tiene } = useAuth();
  const [lotes, setLotes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [seleccionado, setSeleccionado] = useState(null);
  const [lugar, setLugar] = useState(null); // lugar encontrado con el buscador de direcciones
  const [formulario, setFormulario] = useState(null); // null = cerrado, { lote } = abierto

  const puedeCrear = tiene("lotes.crear");
  const puedeEditar = tiene("lotes.editar");
  const puedeEliminar = tiene("lotes.eliminar");

  useEffect(() => {
    api("/lotes", { token: getToken() })
      .then(setLotes)
      .catch((err) => setErrorCarga(err.message))
      .finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtrados = lotes.filter((l) => l.nombre.toLowerCase().includes(busqueda.toLowerCase()));
  const totalHa = lotes.reduce((suma, l) => suma + (l.area_ha ?? 0), 0);

  const alGuardar = (lote) => {
    setLotes((prev) =>
      prev.some((x) => x.id === lote.id) ? prev.map((x) => (x.id === lote.id ? lote : x)) : [lote, ...prev]
    );
    setBusqueda("");
    setSeleccionado(lote.id);
    setFormulario(null);
  };

  const eliminar = async (lote) => {
    const aceptar = await confirmar({
      titulo: "¿Eliminar este lote?",
      texto: `Se eliminará el lote "${lote.nombre}". Esta acción no se puede deshacer.`,
      textoConfirmar: "Sí, eliminar",
      peligro: true,
    });
    if (!aceptar) return;

    try {
      await api(`/lotes/${lote.id}`, { method: "DELETE", token: getToken() });
      setLotes((prev) => prev.filter((x) => x.id !== lote.id));
      if (seleccionado === lote.id) setSeleccionado(null);
      alertaOk("Lote eliminado", `"${lote.nombre}" fue eliminado`);
    } catch (err) {
      alertaError("No se pudo eliminar", err.message);
    }
  };

  if (cargando) return <Cargando texto="Cargando lotes..." />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-emerald-950">Lotes registrados</h2>
          <p className="text-sm text-slate-500">
            {lotes.length} lotes
            {totalHa > 0 && ` · ${formatoHa(totalHa)} ha en total`}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar lote"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
            />
          </div>
          {puedeCrear && (
            <button
              onClick={() => setFormulario({ lote: null })}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-700/25 transition hover:shadow-emerald-700/40"
            >
              <Plus className="h-4 w-4" /> Nuevo lote
            </button>
          )}
        </div>
      </div>

      {errorCarga && <Mensaje tipo="error">{errorCarga}</Mensaje>}

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="space-y-3 lg:col-span-3">
          <BuscadorDireccion onElegir={(r) => setLugar({ ...r, id: Date.now() })} />
          <MapaLotes
            lotes={filtrados}
            seleccionado={seleccionado}
            busqueda={lugar}
            onSeleccionar={setSeleccionado}
          />
        </div>

        <div className="space-y-3 lg:col-span-2 lg:max-h-[620px] lg:overflow-y-auto lg:pr-1">
          {filtrados.map((l, i) => (
            <motion.div
              key={l.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.4) }}
              onClick={() => setSeleccionado(l.id)}
              className={`cursor-pointer rounded-2xl border bg-white p-4 shadow-sm transition ${
                seleccionado === l.id
                  ? "border-amber-400 ring-2 ring-amber-200"
                  : "border-emerald-100 hover:border-emerald-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700">
                  <MapPin className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-emerald-950">{l.nombre}</p>
                  {l.area_ha != null && (
                    <p className="text-sm font-semibold text-emerald-700">{formatoHa(l.area_ha)} ha</p>
                  )}
                  <p className="text-sm text-slate-500">
                    {l.latitud.toFixed(5)}, {l.longitud.toFixed(5)}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-400">
                    {l.creado_por ? `Por ${l.creado_por} · ` : ""}
                    {fechaCorta(l.creado_en)}
                  </p>
                </div>

                <div className="flex shrink-0 gap-1">
                  {puedeEditar && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormulario({ lote: l });
                      }}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-700"
                      aria-label={`Editar ${l.nombre}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                  {puedeEliminar && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        eliminar(l);
                      }}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      aria-label={`Eliminar ${l.nombre}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {filtrados.length === 0 && (
            <div className="rounded-2xl border border-dashed border-emerald-200 bg-white/60 p-8 text-center text-sm text-slate-500">
              {lotes.length === 0 ? "Aún no hay lotes registrados." : "No se encontraron lotes con ese nombre."}
            </div>
          )}
        </div>
      </div>

      {formulario && (
        <FormularioLote
          lote={formulario.lote}
          referencia={formulario.lote ? null : (lotes[0] ?? null)}
          existentes={lotes.filter((l) => l.id !== formulario.lote?.id)}
          onCerrar={() => setFormulario(null)}
          onGuardado={alGuardar}
        />
      )}
    </div>
  );
}