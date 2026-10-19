import { supabase } from "../config/db.js";
import { PERMISOS } from "../config/permisos.js";
import { q } from "../utils/consulta.js";
import { HttpError, asyncHandler } from "../utils/httpError.js";

const limpiarPermisos = (lista) => {
  if (lista.some((p) => !(p in PERMISOS))) {
    throw new HttpError(422, "Hay permisos que no existen");
  }
  return [...new Set(lista)].sort();
};

const buscarRol = (nombre) =>
  q(supabase.from("roles").select("nombre, permisos").eq("nombre", nombre).maybeSingle());

export const catalogo = (req, res) =>
  res.json(Object.entries(PERMISOS).map(([clave, nombre]) => ({ clave, nombre })));

export const listar = asyncHandler(async (req, res) => {
  const lista = await q(supabase.from("roles").select("nombre, permisos").order("nombre"));
  res.json(
    lista.map((r) => ({
      nombre: r.nombre,
      permisos: r.nombre === "admin" ? Object.keys(PERMISOS) : r.permisos,
    }))
  );
});

export const crear = asyncHandler(async (req, res) => {
  const { nombre, permisos } = req.body;

  if (await buscarRol(nombre)) throw new HttpError(409, "Ya existe un rol con ese nombre");

  const rol = await q(
    supabase
      .from("roles")
      .insert({ nombre, permisos: limpiarPermisos(permisos) })
      .select("nombre, permisos")
      .single()
  );
  res.status(201).json(rol);
});

export const modificar = asyncHandler(async (req, res) => {
  const actual = req.params.nombre.toLowerCase();
  const { nombre, permisos } = req.body;

  if (actual === "admin") throw new HttpError(400, "El rol admin no se puede modificar");
  if (actual === "tecnico" && nombre !== "tecnico") {
    throw new HttpError(400, "El rol tecnico no se puede renombrar");
  }

  if (!(await buscarRol(actual))) throw new HttpError(404, "El rol no existe");

  // Los usuarios con este rol se actualizan solos (on update cascade)
  if (nombre !== actual && (nombre === "admin" || (await buscarRol(nombre)))) {
    throw new HttpError(409, "Ya existe un rol con ese nombre");
  }

  const rol = await q(
    supabase
      .from("roles")
      .update({ nombre, permisos: limpiarPermisos(permisos) })
      .eq("nombre", actual)
      .select("nombre, permisos")
      .single()
  );
  res.json(rol);
});

export const eliminar = asyncHandler(async (req, res) => {
  const nombre = req.params.nombre.toLowerCase();

  if (nombre === "admin" || nombre === "tecnico") {
    throw new HttpError(400, `El rol ${nombre} no se puede eliminar`);
  }

  if (!(await buscarRol(nombre))) throw new HttpError(404, "El rol no existe");

  const usuarios = await q(supabase.from("usuarios").select("id").eq("rol", nombre));
  if (usuarios.length > 0) {
    throw new HttpError(
      409,
      `No se puede eliminar: ${usuarios.length} usuario(s) tienen este rol. Cámbiales el rol primero`
    );
  }

  await q(supabase.from("roles").delete().eq("nombre", nombre));
  res.json({ ok: true });
});