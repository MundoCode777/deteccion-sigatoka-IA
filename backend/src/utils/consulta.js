import { HttpError } from "./httpError.js";

// Ejecuta una consulta de Supabase y lanza error si falla
export async function q(consulta) {
  const { data, error } = await consulta;
  if (error) {
    if (error.code === "23505") {
      throw new HttpError(409, "Ya existe un registro con esos datos");
    }
    console.error("Error de base de datos:", error);
    throw new HttpError(500, "Error en la base de datos");
  }
  return data;
}

export const esUuid = (valor) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valor);