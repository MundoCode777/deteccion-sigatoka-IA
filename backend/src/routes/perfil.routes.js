import { Router } from "express";
import { actualizar, cambiarPassword } from "../controllers/perfil.controller.js";
import { autenticar } from "../middlewares/auth.js";
import { validar } from "../middlewares/validar.js";
import { passwordSchema, perfilSchema } from "../validators/schemas.js";

const router = Router();

router.use(autenticar);
router.put("/", validar(perfilSchema), actualizar);
router.put("/password", validar(passwordSchema), cambiarPassword);

export default router;