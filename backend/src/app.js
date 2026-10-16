import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { env } from "./config/env.js";
import { manejarErrores, rutaNoEncontrada } from "./middlewares/errores.js";
import authRoutes from "./routes/auth.routes.js";
import perfilRoutes from "./routes/perfil.routes.js";
import rolesRoutes from "./routes/roles.routes.js";
import usuariosRoutes from "./routes/usuarios.routes.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Authorization", "Content-Type"],
  })
);
app.use(express.json({ limit: "10kb" }));

const limitador = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { detail: "Demasiadas solicitudes. Inténtalo más tarde" },
});

app.get("/salud", (req, res) => res.json({ ok: true }));
app.use("/auth", limitador, authRoutes);
app.use("/usuarios", usuariosRoutes);
app.use("/roles", rolesRoutes);
app.use("/perfil", perfilRoutes);

app.use(rutaNoEncontrada);
app.use(manejarErrores);

export default app;