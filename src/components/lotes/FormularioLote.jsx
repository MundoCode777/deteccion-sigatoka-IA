import { motion } from "framer-motion";
import { Hexagon, Loader2, LocateFixed, MapPin, Navigation, Save, Tag, Trash2, Undo2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { alertaOk } from "../../utils/alertas";
import { areaHectareas, centroide, formatoHa, formatoM2 } from "../../utils/geo";
import Input from "../Input";
import Mensaje from "../Mensaje";
import BuscadorDireccion from "./BuscadorDireccion";
import SelectorUbicacion from "./SelectorUbicacion";

// Convierte el texto escrito en número (acepta coma o punto decimal)
const aNumero = (valor) => {
  const texto = String(valor).trim().replace(",", ".");
  if (texto === "") return null;
  const n = Number(texto);
  return Number.isFinite(n) ? n : null;
};

const redondear = (n) => Number(n.toFixed(6));
const MAX_PUNTOS = 100;

// lote: el que se edita (null si es nuevo)
// referencia: último lote guardado, para abrir el mapa en esa zona (solo lotes nuevos)
// existentes: los demás lotes, se muestran en gris como guía
export default function FormularioLote({ lote, referencia = null, existentes = [], onCerrar, onGuardado }) {
  const { getToken } = useAuth();
  const [nombre, setNombre] = useState(lote?.nombre ?? "");
  const [modo, setModo] = useState((lote ?? referencia)?.poligono ? "area" : "punto");
  const [vertices, setVertices] = useState(lote?.poligono ?? []);
  const [lat, setLat] = useState(lote ? String(lote.latitud) : "");
  const [lng, setLng] = useState(lote ? String(lote.longitud) : "");
  const [enfocar, setEnfocar] = useState(null);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [ubicando, setUbicando] = useState(false);

  const vistaInicial = referencia
    ? { lat: referencia.latitud, lng: referencia.longitud, limites: referencia.poligono }
    : null;

  const enArea = modo === "area";
  const centro = enArea && vertices.length >= 3 ? centroide(vertices) : null;
  const hectareas = enArea ? areaHectareas(vertices) : 0;

  // En modo área la ubicación es el centro del polígono; en modo punto, lo escrito
  const latNum = enArea ? (centro ? centro[0] : null) : aNumero(lat);
  const lngNum = enArea ? (centro ? centro[1] : null) : aNumero(lng);
  const latValida = latNum !== null && latNum >= -90 && latNum <= 90;
  const lngValida = lngNum !== null && lngNum >= -180 && lngNum <= 180;
  const posicion = !enArea && latValida && lngValida ? [latNum, lngNum] : null;

  // Cerrar con Escape
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCerrar]);

  const cambiarModo = (nuevo) => {
    if (nuevo === modo) return;
    if (nuevo === "punto" && centro) {
      setLat(String(centro[0]));
      setLng(String(centro[1]));
    }
    setVertices([]);
    setModo(nuevo);
  };

  const elegirPunto = (la, lo) => {
    setLat(String(redondear(la)));
    setLng(String(redondear(lo)));
  };

  const agregarVertice = (la, lo) =>
    setVertices((v) => (v.length >= MAX_PUNTOS ? v : [...v, [redondear(la), redondear(lo)]]));

  const moverVertice = (i, la, lo) =>
    setVertices((v) => v.map((p, k) => (k === i ? [redondear(la), redondear(lo)] : p)));

  // Ir a un lugar: en modo punto además coloca el marcador ahí
  const irA = (la, lo) => {
    setEnfocar({ lat: la, lng: lo, id: Date.now() });
    if (!enArea) elegirPunto(la, lo);
  };

  // Volver a la zona del último lote guardado (no coloca puntos)
  const irAlUltimo = () =>
    setEnfocar({
      lat: referencia.latitud,
      lng: referencia.longitud,
      limites: referencia.poligono,
      id: Date.now(),
    });

  const usarMiUbicacion = () => {
    if (!navigator.geolocation) {
      return setError("Tu navegador no permite obtener la ubicación");
    }
    setError("");
    setUbicando(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        irA(pos.coords.latitude, pos.coords.longitude);
        setUbicando(false);
      },
      (err) => {
        setUbicando(false);
        setError(
          err.code === 1
            ? "Permiso de ubicación denegado. Actívalo en tu navegador e inténtalo de nuevo"
            : "No se pudo obtener tu ubicación. Inténtalo de nuevo"
        );
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const enviar = async (e) => {
    e.preventDefault();
    setError("");

    if (nombre.trim().length < 2) return setError("Escribe el nombre del lote");
    if (enArea) {
      if (vertices.length < 3) return setError("Marca al menos 3 puntos en el mapa para formar el área");
    } else {
      if (!latValida) return setError("La latitud debe ser un número entre -90 y 90");
      if (!lngValida) return setError("La longitud debe ser un número entre -180 y 180");
    }

    setEnviando(true);
    try {
      const guardado = await api(lote ? `/lotes/${lote.id}` : "/lotes", {
        method: lote ? "PUT" : "POST",
        body: {
          nombre: nombre.trim(),
          latitud: latNum,
          longitud: lngNum,
          poligono: enArea ? vertices : null,
        },
        token: getToken(),
      });
      alertaOk(lote ? "Lote actualizado" : "Lote registrado", `"${guardado.nombre}" se guardó correctamente`);
      onGuardado(guardado);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  const botonModo = (valor, texto, Icono) => (
    <button
      type="button"
      onClick={() => cambiarModo(valor)}
      className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition ${
        modo === valor ? "bg-white text-emerald-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
      }`}
    >
      <Icono className="h-4 w-4" /> {texto}
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/45 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <motion.form
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        onSubmit={enviar}
        noValidate
        className="max-h-[94vh] w-full space-y-5 overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-2xl sm:rounded-3xl sm:p-7"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-emerald-950">{lote ? "Editar lote" : "Registrar nuevo lote"}</h3>
            <p className="text-sm text-slate-500">Marca el lote en el mapa como un punto o como un área</p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <Input
          label="Nombre del lote"
          icon={Tag}
          placeholder="Ej: Lote 3 Norte"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          maxLength={60}
        />

        <BuscadorDireccion onElegir={(r) => irA(r.lat, r.lng)} />

        {referencia && (
          <button
            type="button"
            onClick={irAlUltimo}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2 text-sm font-semibold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700"
          >
            <Navigation className="h-4 w-4" /> Ir al último lote: {referencia.nombre}
          </button>
        )}

        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {botonModo("punto", "Un punto", MapPin)}
          {botonModo("area", "Área en hectáreas", Hexagon)}
        </div>

        <p className="text-sm text-slate-500">
          {enArea
            ? "Toca el mapa para marcar cada esquina del lote. Arrastra los puntos para ajustarlos. Usa la capa Satélite (arriba a la derecha del mapa) para ver los límites reales."
            : "Toca el mapa o arrastra el marcador para elegir la ubicación del lote."}
          {existentes.length > 0 && " Las zonas grises son tus otros lotes."}
        </p>

        <SelectorUbicacion
          modo={modo}
          posicion={posicion}
          vertices={vertices}
          existentes={existentes}
          vistaInicial={vistaInicial}
          enfocar={enfocar}
          onPunto={elegirPunto}
          onAgregarVertice={agregarVertice}
          onMoverVertice={moverVertice}
        />

        {enArea && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-emerald-50 px-4 py-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-700/70">Área del lote</p>
              <p className="text-2xl font-bold text-emerald-800">{formatoHa(hectareas)} ha</p>
              <p className="text-xs text-slate-500">
                {formatoM2(hectareas)} m² · {vertices.length} {vertices.length === 1 ? "punto" : "puntos"}
                {vertices.length < 3 && " (marca al menos 3)"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setVertices((v) => v.slice(0, -1))}
                disabled={vertices.length === 0}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-40"
              >
                <Undo2 className="h-4 w-4" /> Deshacer
              </button>
              <button
                type="button"
                onClick={() => setVertices([])}
                disabled={vertices.length === 0}
                className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" /> Borrar
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={usarMiUbicacion}
          disabled={ubicando}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-60"
        >
          {ubicando ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
          {ubicando ? "Buscando tu ubicación..." : "Ir a mi ubicación"}
        </button>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={enArea ? "Latitud (centro del área)" : "Latitud"}
            icon={MapPin}
            inputMode="decimal"
            placeholder={enArea ? "Se calcula con el área" : "-1.83120"}
            readOnly={enArea}
            value={enArea ? (centro ? String(centro[0]) : "") : lat}
            onChange={(e) => setLat(e.target.value)}
          />
          <Input
            label={enArea ? "Longitud (centro del área)" : "Longitud"}
            icon={MapPin}
            inputMode="decimal"
            placeholder={enArea ? "Se calcula con el área" : "-78.18340"}
            readOnly={enArea}
            value={enArea ? (centro ? String(centro[1]) : "") : lng}
            onChange={(e) => setLng(e.target.value)}
          />
        </div>

        {error && <Mensaje tipo="error">{error}</Mensaje>}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            disabled={enviando}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-green-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-700/25 transition hover:shadow-emerald-700/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enviando ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Save className="h-4 w-4" /> {lote ? "Guardar cambios" : "Registrar lote"}
              </>
            )}
          </button>
        </div>
      </motion.form>
    </div>
  );
}