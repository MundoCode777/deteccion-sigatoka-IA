import { supabase } from "../config/db.js";
import { PERMISOS } from "../config/permisos.js";
import { q } from "./consulta.js";

export async function permisosDe(nombreRol) {
  if (nombreRol === "admin") return Object.keys(PERMISOS);
  const rol = await q(supabase.from("roles").select("permisos").eq("nombre", nombreRol).maybeSingle());
  return rol?.permisos ?? [];
}

export async function aUsuarioOut(u) {
  return {
    id: u.id,
    nombre: u.nombre,
    correo: u.correo,
    rol: u.rol,
    permisos: await permisosDe(u.rol),
  };
}