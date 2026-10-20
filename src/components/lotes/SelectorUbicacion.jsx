import "leaflet/dist/leaflet.css";
import { Fragment, useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polygon,
  Polyline,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { crearIcono, iconoVertice } from "../../utils/iconoMapa";
import CapasBase from "./CapasBase";

const CENTRO_INICIAL = [-1.8312, -78.1834]; // Ecuador
const ICONO = crearIcono("#047857");
const VERTICE = iconoVertice();

const ESTILO_AREA = { color: "#047857", weight: 3, fillColor: "#10b981", fillOpacity: 0.3, interactive: false };
const ESTILO_EXISTENTE = {
  color: "#64748b",
  weight: 2,
  dashArray: "6 6",
  fillColor: "#94a3b8",
  fillOpacity: 0.15,
  interactive: false,
};
const ESTILO_PUNTO_EXISTENTE = {
  color: "#64748b",
  weight: 2,
  fillColor: "#94a3b8",
  fillOpacity: 0.7,
  interactive: false,
};
const ETIQUETA = "!border-0 !bg-white/90 !px-1.5 !py-0.5 !text-[11px] !font-semibold !text-slate-600 !shadow-sm";

function Clics({ onClic }) {
  useMapEvents({ click: (e) => onClic(e.latlng.lat, e.latlng.lng) });
  return null;
}

function Ajustar({ modo, posicion, vertices, enfocar, vistaInicial }) {
  const map = useMap();
  const lat = posicion?.[0];
  const lng = posicion?.[1];

  // La ventana se anima: recalcula el tamaño y luego coloca la vista inicial
  useEffect(() => {
    const t = setTimeout(() => {
      map.invalidateSize();
      if (vertices.length >= 2) {
        map.fitBounds(vertices, { padding: [30, 30], maxZoom: 18 });
      } else if (vistaInicial?.limites?.length >= 2) {
        map.fitBounds(vistaInicial.limites, { padding: [30, 30], maxZoom: 18 });
      } else if (vistaInicial) {
        map.setView([vistaInicial.lat, vistaInicial.lng], 17);
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  // Modo punto: si el marcador queda fuera de la vista, mueve el mapa hasta él
  useEffect(() => {
    if (modo !== "punto" || lat == null) return;
    if (!map.getBounds().contains([lat, lng])) {
      map.setView([lat, lng], Math.max(map.getZoom(), 16));
    }
  }, [modo, lat, lng, map]);

  // Viaja al lugar buscado o al último lote
  useEffect(() => {
    if (!enfocar) return;
    if (enfocar.limites?.length >= 2) {
      map.flyToBounds(enfocar.limites, { padding: [30, 30], maxZoom: 18, duration: 0.8 });
    } else {
      map.flyTo([enfocar.lat, enfocar.lng], 17, { duration: 0.8 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enfocar?.id, map]);

  return null;
}

export default function SelectorUbicacion({
  modo,
  posicion,
  vertices,
  existentes = [],
  vistaInicial,
  enfocar,
  onPunto,
  onAgregarVertice,
  onMoverVertice,
}) {
  const centroMapa = posicion ?? (vistaInicial ? [vistaInicial.lat, vistaInicial.lng] : CENTRO_INICIAL);
  const zoomMapa = posicion ? 16 : vistaInicial ? 17 : 7;

  return (
    <div className="relative isolate z-0 h-72 overflow-hidden rounded-2xl border border-slate-200 sm:h-80">
      <MapContainer center={centroMapa} zoom={zoomMapa} maxZoom={20} scrollWheelZoom className="h-full w-full">
        <CapasBase />
        <Clics onClic={modo === "punto" ? onPunto : onAgregarVertice} />
        <Ajustar
          modo={modo}
          posicion={posicion}
          vertices={vertices}
          enfocar={enfocar}
          vistaInicial={vistaInicial}
        />

        {/* Lotes ya registrados, solo como referencia */}
        {existentes.map((l) => (
          <Fragment key={l.id}>
            {l.poligono ? (
              <Polygon positions={l.poligono} pathOptions={ESTILO_EXISTENTE}>
                <Tooltip permanent direction="center" className={ETIQUETA}>
                  {l.nombre}
                </Tooltip>
              </Polygon>
            ) : (
              <CircleMarker center={[l.latitud, l.longitud]} radius={7} pathOptions={ESTILO_PUNTO_EXISTENTE}>
                <Tooltip permanent direction="top" offset={[0, -6]} className={ETIQUETA}>
                  {l.nombre}
                </Tooltip>
              </CircleMarker>
            )}
          </Fragment>
        ))}

        {modo === "punto" && posicion && (
          <Marker
            position={posicion}
            icon={ICONO}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const p = e.target.getLatLng();
                onPunto(p.lat, p.lng);
              },
            }}
          />
        )}

        {modo === "area" && (
          <>
            {vertices.length >= 3 && <Polygon positions={vertices} pathOptions={ESTILO_AREA} />}
            {vertices.length === 2 && <Polyline positions={vertices} pathOptions={ESTILO_AREA} />}

            {vertices.map((v, i) => (
              <Marker
                key={i}
                position={v}
                icon={VERTICE}
                draggable
                eventHandlers={{
                  dragend: (e) => {
                    const p = e.target.getLatLng();
                    onMoverVertice(i, p.lat, p.lng);
                  },
                }}
              />
            ))}
          </>
        )}
      </MapContainer>
    </div>
  );
}