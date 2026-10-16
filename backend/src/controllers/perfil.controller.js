import bcrypt from "bcryptjs";
import Usuario from "../models/Usuario.js";
import { HttpError, asyncHandler } from "../utils/httpError.js";
import { aUsuarioOut } from "../utils/usuario.js";

export const actualizar = asyncHandler(async (req, res) => {
  const { nombre, correo } = req.body;

  const otro = await Usuario.exists({ correo, _id: { $ne: req.user._id } });
  if (otro) throw new HttpError(409, "Ese correo ya está en uso");

  req.user.nombre = nombre;
  req.user.correo = correo;
  await req.user.save();

  res.json(await aUsuarioOut(req.user));
});

export const cambiarPassword = asyncHandler(async (req, res) => {
  const { actual, nueva } = req.body;

  if (!(await bcrypt.compare(actual, req.user.password_hash))) {
    throw new HttpError(400, "La contraseña actual es incorrecta");
  }
  if (actual === nueva) {
    throw new HttpError(400, "La nueva contraseña debe ser distinta a la actual");
  }

  req.user.password_hash = await bcrypt.hash(nueva, 12);
  await req.user.save();
  res.json({ ok: true });
});