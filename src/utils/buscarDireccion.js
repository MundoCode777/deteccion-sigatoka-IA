// Código ISO del país donde buscar ("" = todo el mundo)
const PAIS = "ec";

// Buscador gratuito de OpenStreetMap (Nominatim)
export async function buscarDireccion(texto) {
  const params = new URLSearchParams({
    q: texto,
    format: "jsonv2",
    limit: "6",
    "accept-language": "es",
  });
  if (PAIS) params.set("countrycodes", PAIS);

  let res;
  try {
    res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
  } catch {
    throw new Error("No se pudo conectar con el buscador de direcciones");
  }
  if (!res.ok) throw new Error("El buscador no está disponible. Inténtalo de nuevo");

  const datos = await res.json();
  return datos.map((d) => ({
    id: d.place_id,
    nombre: d.display_name,
    lat: Number(d.lat),
    lng: Number(d.lon),
  }));
}