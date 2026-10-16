import Rol from "../models/Rol.js";
import { PERMISOS } from "../config/permisos.js";

export async function permisosDe(nombreRol) {
  if (nombreRol === "admin") return Object.keys(PERMISOS);
  const rol = await Rol.findOne({ nombre: nombreRol }).lean();
  return rol?.permisos ?? [];
}

export async function aUsuarioOut(u) {
  return {
    id: String(u._id),
    nombre: u.nombre,
    correo: u.correo,
    rol: u.rol,
    permisos: await permisosDe(u.rol),
  };
}