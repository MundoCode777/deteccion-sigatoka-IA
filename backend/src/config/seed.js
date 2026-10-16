import bcrypt from "bcryptjs";
import { q } from "../utils/consulta.js";
import { supabase } from "./db.js";
import { env } from "./env.js";
import { PERMISOS, PERMISOS_TECNICO } from "./permisos.js";

export async function sembrarDatos() {
  // El admin siempre tiene todos los permisos
  await q(
    supabase
      .from("roles")
      .upsert({ nombre: "admin", permisos: Object.keys(PERMISOS) }, { onConflict: "nombre" })
  );

  // El técnico se crea una sola vez; luego el admin lo edita desde el panel
  await q(
    supabase
      .from("roles")
      .upsert(
        { nombre: "tecnico", permisos: PERMISOS_TECNICO },
        { onConflict: "nombre", ignoreDuplicates: true }
      )
  );

  // Primer administrador
  if (env.ADMIN_CORREO && env.ADMIN_PASSWORD) {
    const correo = env.ADMIN_CORREO.toLowerCase();
    const existe = await q(supabase.from("usuarios").select("id").eq("correo", correo).maybeSingle());

    if (!existe) {
      await q(
        supabase.from("usuarios").insert({
          nombre: env.ADMIN_NOMBRE,
          correo,
          password_hash: await bcrypt.hash(env.ADMIN_PASSWORD, 12),
          rol: "admin",
        })
      );
      console.log("👤 Administrador inicial creado");
    }
  }
}