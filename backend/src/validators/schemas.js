import { z } from "zod";

const nombre = z.string().trim().min(2, "Escribe tu nombre completo").max(80, "El nombre es muy largo");

const correo = z.string().trim().toLowerCase().email("El correo no es válido").max(120);

const passwordFuerte = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .max(72, "La contraseña es demasiado larga")
  .refine(
    (v) => /[A-Z]/.test(v) && /[a-z]/.test(v) && /\d/.test(v),
    "La contraseña debe tener mayúscula, minúscula y número"
  );

export const registroSchema = z.object({ nombre, correo, password: passwordFuerte });

export const loginSchema = z.object({
  correo,
  password: z.string().min(1, "Escribe tu contraseña").max(72),
});

export const perfilSchema = z.object({ nombre, correo });

export const passwordSchema = z.object({
  actual: z.string().min(1, "Escribe tu contraseña actual").max(72),
  nueva: passwordFuerte,
});

export const asignarRolSchema = z.object({
  rol: z.string().trim().toLowerCase().min(1, "Elige un rol").max(30),
});

export const rolSchema = z.object({
  nombre: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "El nombre del rol debe tener al menos 3 caracteres")
    .max(30, "El nombre del rol es muy largo")
    .regex(/^[a-záéíóúñ0-9 _-]+$/, "El nombre solo puede tener letras, números, espacios, - y _"),
  permisos: z.array(z.string()).default([]),
});