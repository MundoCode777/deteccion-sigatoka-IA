import mongoose from "mongoose";
import { env } from "./env.js";

export async function conectarDB() {
  await mongoose.connect(env.MONGO_URI, {
    dbName: env.MONGO_DB,
    serverSelectionTimeoutMS: 8000,
  });
  console.log("✅ Conectado a MongoDB Atlas");
}