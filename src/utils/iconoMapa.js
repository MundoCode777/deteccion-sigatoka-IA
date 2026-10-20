import L from "leaflet";

// Marcador en forma de pin, dibujado en SVG (no depende de imágenes externas)
export function crearIcono(color = "#047857", grande = false) {
  const ancho = grande ? 40 : 32;
  const alto = grande ? 52 : 42;

  return L.divIcon({
    className: "",
    html: `
      <svg width="${ancho}" height="${alto}" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg"
           style="filter: drop-shadow(0 2px 3px rgba(0,0,0,.35));">
        <path d="M16 1C7.7 1 1 7.7 1 15.9 1 26.8 16 41 16 41s15-14.2 15-25.1C31 7.7 24.3 1 16 1z"
              fill="${color}" stroke="white" stroke-width="2"/>
        <circle cx="16" cy="16" r="6" fill="white"/>
      </svg>`,
    iconSize: [ancho, alto],
    iconAnchor: [ancho / 2, alto],
    popupAnchor: [0, -alto + 6],
  });
}

// Punto redondo para las esquinas del área
export function iconoVertice() {
  return L.divIcon({
    className: "",
    html: `<div style="width:18px;height:18px;border-radius:50%;background:#fff;border:3px solid #047857;box-shadow:0 1px 4px rgba(0,0,0,.45)"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}