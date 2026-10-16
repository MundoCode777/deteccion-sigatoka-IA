import jwt from "jsonwebtoken";
import { supabase } from "../config/db.js";
import { env } from "../config/env.js";
import { esUuid, q } from "../utils/consulta.js";
import { HttpError, asyncHandler } from "../utils/httpError.js";
import { permisosDe } from "../utils/usuario.js";

export const autenticar = asyncHandler(async (req, res, next) => {
  const cabecera = req.headers.authorization;
  const sesionInvalida = new HttpError(401, "Sesión inválida o expirada");

  if (!cabecera?.startsWith("Bearer ")) throw sesionInvalida;

  let datos;
  try {
    datos = jwt.verify(cabecera.slice(7), env.JWT_SECRET);
  } catch {
    throw sesionInvalida;
  }
  if (!esUuid(datos.sub)) throw sesionInvalida;

  const user = await q(supabase.from("usuarios").select("*").eq("id", datos.sub).maybeSingle());
  if (!user || !user.activo) throw sesionInvalida;

  req.user = user;
  next();
});

// Uso: router.get("/", requierePermiso("usuarios.ver"), controlador)
export const requierePermiso = (...permisos) => [
  autenticar,
  asyncHandler(async (req, res, next) => {
    const propios = await permisosDe(req.user.rol);
    if (!permisos.some((p) => propios.includes(p))) {
      throw new HttpError(403, "No tienes permiso para esta acción");
    }
    next();
  }),
];