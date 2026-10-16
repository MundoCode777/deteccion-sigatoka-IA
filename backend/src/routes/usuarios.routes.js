import { Router } from "express";
import { asignarRol, listar } from "../controllers/usuarios.controller.js";
import { requierePermiso } from "../middlewares/auth.js";
import { validar } from "../middlewares/validar.js";
import { asignarRolSchema } from "../validators/schemas.js";

const router = Router();

router.get("/", requierePermiso("usuarios.ver"), listar);
router.put(
  "/:id/rol",
  requierePermiso("usuarios.asignar_rol"),
  validar(asignarRolSchema),
  asignarRol
);

export default router;