import { Router } from "express";
import { login, me, registro } from "../controllers/auth.controller.js";
import { autenticar } from "../middlewares/auth.js";
import { validar } from "../middlewares/validar.js";
import { loginSchema, registroSchema } from "../validators/schemas.js";

const router = Router();

router.post("/registro", validar(registroSchema), registro);
router.post("/login", validar(loginSchema), login);
router.get("/me", autenticar, me);

export default router;