import { supabase } from "../config/db.js";
import { esUuid, q } from "../utils/consulta.js";
import { HttpError, asyncHandler } from "../utils/httpError.js";

export const listar = asyncHandler(async (req, res) => {
  const lista = await q(
    supabase
      .from("usuarios")
      .select("id, nombre, correo, rol, creado_en")
      .order("creado_en", { ascending: false })
  );
  res.json(lista);
});

export const asignarRol = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rol } = req.body;
  const actor = req.user;

  if (!esUuid(id)) throw new HttpError(404, "Usuario no encontrado");

  if (actor.id === id) throw new HttpError(400, "No puedes cambiar tu propio rol");

  const destino = await q(supabase.from("usuarios").select("id, rol").eq("id", id).maybeSingle());
  if (!destino) throw new HttpError(404, "Usuario no encontrado");

  // Solo un administrador puede tocar cuentas admin o entregar el rol admin
  if (actor.rol !== "admin" && (destino.rol === "admin" || rol === "admin")) {
    throw new HttpError(403, "Solo un administrador puede hacer esto");
  }

  const existeRol = await q(supabase.from("roles").select("nombre").eq("nombre", rol).maybeSingle());
  if (!existeRol) throw new HttpError(404, "El rol no existe");

  await q(supabase.from("usuarios").update({ rol }).eq("id", id));
  res.json({ ok: true });
});