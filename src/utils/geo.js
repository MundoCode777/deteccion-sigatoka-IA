const RADIO_TIERRA = 6378137; // metros
const aRadianes = (grados) => (grados * Math.PI) / 180;

// Área aproximada en hectáreas. puntos: [[lat, lng], ...]
export function areaHectareas(puntos) {
  if (!puntos || puntos.length < 3) return 0;

  let suma = 0;
  for (let i = 0; i < puntos.length; i++) {
    const [lat1, lng1] = puntos[i];
    const [lat2, lng2] = puntos[(i + 1) % puntos.length];
    suma += aRadianes(lng2 - lng1) * (2 + Math.sin(aRadianes(lat1)) + Math.sin(aRadianes(lat2)));
  }
  return Math.abs((suma * RADIO_TIERRA * RADIO_TIERRA) / 2) / 10000;
}

// Punto central de los vértices (sirve como "ubicación" del lote)
export function centroide(puntos) {
  const n = puntos.length;
  const lat = puntos.reduce((s, p) => s + p[0], 0) / n;
  const lng = puntos.reduce((s, p) => s + p[1], 0) / n;
  return [Number(lat.toFixed(6)), Number(lng.toFixed(6))];
}

export const formatoHa = (ha) =>
  ha.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatoM2 = (ha) => Math.round(ha * 10000).toLocaleString("es-EC");