import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Usuario from "../models/Usuario.js";
import { env } from "../config/env.js";
import { HttpError, asyncHandler } from "../utils/httpError.js";
import { aUsuarioOut } from "../utils/usuario.js";

// Límite de intentos fallidos: 5 por correo cada 5 minutos
const MAX_INTENTOS = 5;
const VENTANA_MS = 5 * 60 * 1000;
const intentos = new Map();

const estaBloqueado = (correo) => {
  const ahora = Date.now();
  const recientes = (intentos.get(correo) || []).filter((t) => ahora - t < VENTANA_MS);
  intentos.set(correo, recientes);
  return recientes.length >= MAX_INTENTOS;
};

// Se usa para que el tiempo de respuesta sea igual aunque el correo no exista
const DUMMY_HASH = bcrypt.hashSync("dummy-password-123", 12);

const firmarToken = (user) =>
  jwt.sign({ sub: String(user._id) }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRA });

const respuestaToken = async (user) => ({
  access_token: firmarToken(user),
  token_type: "bearer",
  usuario: await aUsuarioOut(user),
});

export const registro = asyncHandler(async (req, res) => {
  const { nombre, correo, password } = req.body;

  if (await Usuario.exists({ correo })) {
    throw new HttpError(409, "Ese correo ya está registrado");
  }

  const user = await Usuario.create({
    nombre,
    correo,
    password_hash: await bcrypt.hash(password, 12),
    rol: "tecnico",
  });

  res.status(201).json(await respuestaToken(user));
});

export const login = asyncHandler(async (req, res) => {
  const { correo, password } = req.body;

  if (estaBloqueado(correo)) {
    throw new HttpError(429, "Demasiados intentos. Espera 5 minutos e inténtalo de nuevo");
  }

  const user = await Usuario.findOne({ correo });
  const valido = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);

  if (!user || !valido || !user.activo) {
    intentos.set(correo, [...(intentos.get(correo) || []), Date.now()]);
    throw new HttpError(401, "Correo o contraseña incorrectos");
  }

  intentos.delete(correo);
  res.json(await respuestaToken(user));
});

export const me = asyncHandler(async (req, res) => {
  res.json(await aUsuarioOut(req.user));
});