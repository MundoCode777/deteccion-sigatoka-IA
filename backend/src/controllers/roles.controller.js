import Rol from "../models/Rol.js";
import Usuario from "../models/Usuario.js";
import { PERMISOS } from "../config/permisos.js";
import { HttpError, asyncHandler } from "../utils/httpError.js";

const limpiarPermisos = (lista) => {
  if (lista.some((p) => !(p in PERMISOS))) {
    throw new HttpError(422, "Hay permisos que no existen");
  }
  return [...new Set(lista)].sort();
};

export const catalogo = (req, res) =>
  res.json(Object.entries(PERMISOS).map(([clave, nombre]) => ({ clave, nombre })));

export const listar = asyncHandler(async (req, res) => {
  const lista = await Rol.find().sort({ nombre: 1 }).lean();
  res.json(
    lista.map((r) => ({
      nombre: r.nombre,
      permisos: r.nombre === "admin" ? Object.keys(PERMISOS) : r.permisos,
    }))
  );
});

export const crear = asyncHandler(async (req, res) => {
  const { nombre, permisos } = req.body;

  if (await Rol.exists({ nombre })) {
    throw new HttpError(409, "Ya existe un rol con ese nombre");
  }

  const rol = await Rol.create({ nombre, permisos: limpiarPermisos(permisos) });
  res.status(201).json({ nombre: rol.nombre, permisos: rol.permisos });
});

export const modificar = asyncHandler(async (req, res) => {
  const actual = req.params.nombre.toLowerCase();
  const { nombre, permisos } = req.body;

  if (actual === "admin") throw new HttpError(400, "El rol admin no se puede modificar");
  if (actual === "tecnico" && nombre !== "tecnico") {
    throw new HttpError(400, "El rol tecnico no se puede renombrar");
  }

  const rol = await Rol.findOne({ nombre: actual });
  if (!rol) throw new HttpError(404, "El rol no existe");

  if (nombre !== actual) {
    if (nombre === "admin" || (await Rol.exists({ nombre }))) {
      throw new HttpError(409, "Ya existe un rol con ese nombre");
    }
    await Usuario.updateMany({ rol: actual }, { $set: { rol: nombre } });
    rol.nombre = nombre;
  }

  rol.permisos = limpiarPermisos(permisos);
  await rol.save();
  res.json({ nombre: rol.nombre, permisos: rol.permisos });
});