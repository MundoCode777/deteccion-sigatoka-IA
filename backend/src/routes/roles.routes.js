import { Router } from "express";
import { catalogo, crear, listar, modificar } from "../controllers/roles.controller.js";
import { autenticar, requierePermiso } from "../middlewares/auth.js";
import { validar } from "../middlewares/validar.js";
import { rolSchema } from "../validators/schemas.js";

const router = Router();

router.get("/permisos", autenticar, catalogo);
router.get("/", autenticar, listar);
router.post("/", requierePermiso("roles.gestionar"), validar(rolSchema), crear);
router.put("/:nombre", requierePermiso("roles.gestionar"), validar(rolSchema), modificar);

export default router;