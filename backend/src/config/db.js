import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export async function conectarDB() {
  const { error } = await supabase.from("roles").select("id").limit(1);
  if (error) {
    throw new Error(
      `No se pudo conectar a Supabase (${error.message}). ¿Ejecutaste el SQL de las tablas y revisaste las claves del .env?`
    );
  }
  console.log("✅ Conectado a Supabase");
}