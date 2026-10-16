import bcrypt from "bcryptjs";
import Rol from "../models/Rol.js";
import Usuario from "../models/Usuario.js";
import { env } from "./env.js";
import { PERMISOS, PERMISOS_TECNICO } from "./permisos.js";

export async function sembrarDatos() {
  // El admin siempre tiene todos los permisos
  await Rol.updateOne(
    { nombre: "admin" },
    { $set: { permisos: Object.keys(PERMISOS) } },
    { upsert: true }
  );

  // El técnico se crea una sola vez; luego el admin lo edita desde el panel
  await Rol.updateOne(
    { nombre: "tecnico" },
    { $setOnInsert: { permisos: PERMISOS_TECNICO } },
    { upsert: true }
  );

  // Primer administrador
  if (env.ADMIN_CORREO && env.ADMIN_PASSWORD) {
    const correo = env.ADMIN_CORREO.toLowerCase();
    if (!(await Usuario.exists({ correo }))) {
      await Usuario.create({
        nombre: env.ADMIN_NOMBRE,
        correo,
        password_hash: await bcrypt.hash(env.ADMIN_PASSWORD, 12),
        rol: "admin",
      });
      console.log("👤 Administrador inicial creado");
    }
  }
}