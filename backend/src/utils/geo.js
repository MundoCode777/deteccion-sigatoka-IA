const RADIO_TIERRA = 6378137; // metros
const aRadianes = (grados) => (grados * Math.PI) / 180;

// Área aproximada de un polígono sobre la esfera, en hectáreas.
// puntos: [[lat, lng], [lat, lng], ...]
export function areaHectareas(puntos) {
  if (!Array.isArray(puntos) || puntos.length < 3) return 0;

  let suma = 0;
  for (let i = 0; i < puntos.length; i++) {
    const [lat1, lng1] = puntos[i];
    const [lat2, lng2] = puntos[(i + 1) % puntos.length];
    suma += aRadianes(lng2 - lng1) * (2 + Math.sin(aRadianes(lat1)) + Math.sin(aRadianes(lat2)));
  }

  const metrosCuadrados = Math.abs((suma * RADIO_TIERRA * RADIO_TIERRA) / 2);
  return Math.round((metrosCuadrados / 10000) * 10000) / 10000;
}