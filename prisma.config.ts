// prisma.config.ts
import { defineConfig } from "prisma/config";
import dotenv from "dotenv";

dotenv.config(); // 👈 garante que .env seja carregado

export default defineConfig({
  schema: "prisma/schema.prisma",
  seed: "tsx prisma/seed.ts",
});
