import { supabase } from "../config/db.js";
import { esUuid, q } from "../utils/consulta.js";
import { areaHectareas } from "../utils/geo.js";
import { HttpError, asyncHandler } from "../utils/httpError.js";

const CAMPOS =
  "id, nombre, latitud, longitud, poligono, area_ha, creado_en, creador:usuarios!creado_por(nombre)";
const DUPLICADO = { duplicado: "Ya existe un lote con ese nombre" };

const aLoteOut = (l) => ({
  id: l.id,
  nombre: l.nombre,
  latitud: l.latitud,
  longitud: l.longitud,
  poligono: l.poligono ?? null,
  area_ha: l.area_ha ?? null,
  creado_en: l.creado_en,
  creado_por: l.creador?.nombre ?? null,
});

// El área siempre se calcula en el servidor, nunca se confía en el cliente
const datosGeo = ({ latitud, longitud, poligono }) => {
  const hayArea = Array.isArray(poligono) && poligono.length >= 3;
  return {
    latitud,
    longitud,
    poligono: hayArea ? poligono : null,
    area_ha: hayArea ? areaHectareas(poligono) : null,
  };
};

export const listar = asyncHandler(async (req, res) => {
  const lista = await q(
    supabase.from("lotes").select(CAMPOS).order("creado_en", { ascending: false })
  );
  res.json(lista.map(aLoteOut));
});

export const crear = asyncHandler(async (req, res) => {
  const lote = await q(
    supabase
      .from("lotes")
      .insert({ nombre: req.body.nombre, ...datosGeo(req.body), creado_por: req.user.id })
      .select(CAMPOS)
      .single(),
    DUPLICADO
  );
  res.status(201).json(aLoteOut(lote));
});

export const modificar = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!esUuid(id)) throw new HttpError(404, "Lote no encontrado");

  const lote = await q(
    supabase
      .from("lotes")
      .update({ nombre: req.body.nombre, ...datosGeo(req.body) })
      .eq("id", id)
      .select(CAMPOS)
      .maybeSingle(),
    DUPLICADO
  );
  if (!lote) throw new HttpError(404, "Lote no encontrado");

  res.json(aLoteOut(lote));
});

export const eliminar = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!esUuid(id)) throw new HttpError(404, "Lote no encontrado");

  const existe = await q(supabase.from("lotes").select("id").eq("id", id).maybeSingle());
  if (!existe) throw new HttpError(404, "Lote no encontrado");

  await q(supabase.from("lotes").delete().eq("id", id), {
    relacion: "No se puede eliminar: este lote tiene detecciones registradas",
  });
  res.json({ ok: true });
});