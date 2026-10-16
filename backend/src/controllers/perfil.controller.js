import bcrypt from "bcryptjs";
import { supabase } from "../config/db.js";
import { q } from "../utils/consulta.js";
import { HttpError, asyncHandler } from "../utils/httpError.js";
import { aUsuarioOut } from "../utils/usuario.js";

export const actualizar = asyncHandler(async (req, res) => {
  const { nombre, correo } = req.body;

  const otro = await q(
    supabase.from("usuarios").select("id").eq("correo", correo).neq("id", req.user.id).maybeSingle()
  );
  if (otro) throw new HttpError(409, "Ese correo ya está en uso");

  const user = await q(
    supabase.from("usuarios").update({ nombre, correo }).eq("id", req.user.id).select().single()
  );

  res.json(await aUsuarioOut(user));
});

export const cambiarPassword = asyncHandler(async (req, res) => {
  const { actual, nueva } = req.body;

  if (!(await bcrypt.compare(actual, req.user.password_hash))) {
    throw new HttpError(400, "La contraseña actual es incorrecta");
  }
  if (actual === nueva) {
    throw new HttpError(400, "La nueva contraseña debe ser distinta a la actual");
  }

  await q(
    supabase
      .from("usuarios")
      .update({ password_hash: await bcrypt.hash(nueva, 12) })
      .eq("id", req.user.id)
  );
  res.json({ ok: true });
});