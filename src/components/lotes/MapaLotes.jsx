import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { MapContainer, Marker, Polygon, Popup, useMap } from "react-leaflet";
import { formatoHa } from "../../utils/geo";
import { crearIcono } from "../../utils/iconoMapa";
import CapasBase from "./CapasBase";

const CENTRO_INICIAL = [-1.8312, -78.1834]; // Ecuador
const ICONO = crearIcono("#047857");
const ICONO_ACTIVO = crearIcono("#f59e0b", true);
const ICONO_BUSQUEDA = crearIcono("#2563eb");

const AREA = { color: "#047857", weight: 2, fillColor: "#10b981", fillOpacity: 0.25 };
const AREA_ACTIVA = { color: "#f59e0b", weight: 3, fillColor: "#fbbf24", fillOpacity: 0.35 };

function Ajustar({ lotes, seleccionado, busqueda }) {
  const map = useMap();
  const clave = lotes
    .map((l) => `${l.id}:${l.latitud}:${l.longitud}:${l.poligono?.length ?? 0}`)
    .join("|");

  // Recalcula el tamaño del mapa una vez que el contenedor ya está en pantalla
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(t);
  }, [map]);

  // Enfoca todos los lotes visibles (puntos y áreas)
  useEffect(() => {
    const puntos = lotes.flatMap((l) => l.poligono ?? [[l.latitud, l.longitud]]);
    if (!puntos.length) return;
    if (puntos.length === 1) {
      map.setView(puntos[0], 16);
    } else {
      map.fitBounds(puntos, { padding: [40, 40], maxZoom: 18 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, map]);

  // Vuela hasta el lote seleccionado
  useEffect(() => {
    const lote = lotes.find((l) => l.id === seleccionado);
    if (!lote) return;
    if (lote.poligono) {
      map.flyToBounds(lote.poligono, { padding: [40, 40], maxZoom: 18, duration: 0.8 });
    } else {
      map.flyTo([lote.latitud, lote.longitud], Math.max(map.getZoom(), 17), { duration: 0.8 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seleccionado, map]);

  // Vuela hasta el lugar buscado
  useEffect(() => {
    if (busqueda) map.flyTo([busqueda.lat, busqueda.lng], 17, { duration: 0.8 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda?.id, map]);

  return null;
}

export default function MapaLotes({ lotes, seleccionado, busqueda, onSeleccionar }) {
  return (
    <div className="relative isolate z-0 h-72 overflow-hidden rounded-3xl border border-emerald-100 shadow-sm sm:h-96 lg:h-[540px]">
      <MapContainer center={CENTRO_INICIAL} zoom={7} maxZoom={20} scrollWheelZoom={false} className="h-full w-full">
        <CapasBase />
        <Ajustar lotes={lotes} seleccionado={seleccionado} busqueda={busqueda} />

        {lotes.map((l) => {
          const activo = l.id === seleccionado;
          return (
            <div key={l.id}>
              {l.poligono && (
                <Polygon
                  positions={l.poligono}
                  pathOptions={activo ? AREA_ACTIVA : AREA}
                  eventHandlers={{ click: () => onSeleccionar?.(l.id) }}
                />
              )}
              <Marker
                position={[l.latitud, l.longitud]}
                icon={activo ? ICONO_ACTIVO : ICONO}
                eventHandlers={{ click: () => onSeleccionar?.(l.id) }}
              >
                <Popup>
                  <strong>{l.nombre}</strong>
                  <br />
                  {l.latitud.toFixed(5)}, {l.longitud.toFixed(5)}
                  {l.area_ha != null && (
                    <>
                      <br />
                      <strong>{formatoHa(l.area_ha)} ha</strong>
                    </>
                  )}
                </Popup>
              </Marker>
            </div>
          );
        })}

        {busqueda && (
          <Marker position={[busqueda.lat, busqueda.lng]} icon={ICONO_BUSQUEDA}>
            <Popup>{busqueda.nombre}</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}