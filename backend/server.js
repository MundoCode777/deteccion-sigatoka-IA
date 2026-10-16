import app from "./src/app.js";
import { env } from "./src/config/env.js";
import { conectarDB } from "./src/config/db.js";
import { sembrarDatos } from "./src/config/seed.js";

try {
  await conectarDB();
  await sembrarDatos();
  app.listen(env.PORT, () => console.log(`🚀 API lista en http://localhost:${env.PORT}`));
} catch (err) {
  console.error("❌ No se pudo iniciar el servidor:", err.message);
  process.exit(1);
}