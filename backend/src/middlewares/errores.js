import { HttpError } from "../utils/httpError.js";

export const rutaNoEncontrada = (req, res) =>
  res.status(404).json({ detail: "Ruta no encontrada" });

// eslint-disable-next-line no-unused-vars
export const manejarErrores = (err, req, res, next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ detail: err.message });
  }
  if (err?.status && err.status < 500) {
    return res.status(err.status).json({ detail: "Solicitud inválida" });
  }
  console.error(err);
  res.status(500).json({ detail: "Error interno del servidor" });
};