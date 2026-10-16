import mongoose from "mongoose";

const rolSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, unique: true, lowercase: true, trim: true },
    permisos: { type: [String], default: [] },
  },
  { collection: "roles", versionKey: false }
);

export default mongoose.model("Rol", rolSchema);