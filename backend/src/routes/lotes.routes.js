import { Router } from "express";
import { crear, eliminar, listar, modificar } from "../controllers/lotes.controller.js";
import { requierePermiso } from "../middlewares/auth.js";
import { validar } from "../middlewares/validar.js";
import { loteSchema } from "../validators/schemas.js";

const router = Router();

router.get("/", requierePermiso("lotes.ver"), listar);
router.post("/", requierePermiso("lotes.crear"), validar(loteSchema), crear);
router.put("/:id", requierePermiso("lotes.editar"), validar(loteSchema), modificar);
router.delete("/:id", requierePermiso("lotes.eliminar"), eliminar);

export default router;