import mongoose from "mongoose";

const usuarioSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    correo: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    rol: { type: String, required: true, default: "tecnico" },
    activo: { type: Boolean, default: true },
    creado_en: { type: Date, default: Date.now },
  },
  { collection: "usuarios", versionKey: false }
);

export default mongoose.model("Usuario", usuarioSchema);