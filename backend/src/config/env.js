import "dotenv/config";

const requerida = (nombre) => {
  const valor = process.env[nombre];
  if (!valor) throw new Error(`Falta ${nombre} en el archivo .env`);
  return valor;
};

export const env = {
  PORT: process.env.PORT || 8000,
  JWT_SECRET: requerida("JWT_SECRET"),
  JWT_EXPIRA: process.env.JWT_EXPIRA || "60m",
  SUPABASE_URL: requerida("SUPABASE_URL"),
  SUPABASE_SERVICE_KEY: requerida("SUPABASE_SERVICE_KEY"),
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
  ADMIN_NOMBRE: process.env.ADMIN_NOMBRE || "Administrador",
  ADMIN_CORREO: process.env.ADMIN_CORREO,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
};