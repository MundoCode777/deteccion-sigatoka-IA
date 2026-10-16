import mongoose from "mongoose";
import Rol from "../models/Rol.js";
import Usuario from "../models/Usuario.js";
import { HttpError, asyncHandler } from "../utils/httpError.js";

export const listar = asyncHandler(async (req, res) => {
  const lista = await Usuario.find().sort({ creado_en: -1 }).lean();
  res.json(
    lista.map((u) => ({
      id: String(u._id),
      nombre: u.nombre,
      correo: u.correo,
      rol: u.rol,
      creado_en: u.creado_en,
    }))
  );
});

export const asignarRol = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rol } = req.body;
  const actor = req.user;

  if (!mongoose.isValidObjectId(id)) throw new HttpError(404, "Usuario no encontrado");

  if (String(actor._id) === id) {
    throw new HttpError(400, "No puedes cambiar tu propio rol");
  }

  const destino = await Usuario.findById(id);
  if (!destino) throw new HttpError(404, "Usuario no encontrado");

  // Solo un administrador puede tocar cuentas admin o entregar el rol admin
  if (actor.rol !== "admin" && (destino.rol === "admin" || rol === "admin")) {
    throw new HttpError(403, "Solo un administrador puede hacer esto");
  }

  if (!(await Rol.exists({ nombre: rol }))) throw new HttpError(404, "El rol no existe");

  destino.rol = rol;
  await destino.save();
  res.json({ ok: true });
});