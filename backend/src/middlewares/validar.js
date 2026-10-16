// Formato de error compatible con el frontend: { detail: [{ msg }] }
export const validar = (schema) => (req, res, next) => {
  const resultado = schema.safeParse(req.body);
  if (!resultado.success) {
    return res.status(422).json({
      detail: resultado.error.issues.map((i) => ({ msg: i.message })),
    });
  }
  req.body = resultado.data;
  next();
};