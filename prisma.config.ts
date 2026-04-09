import { config } from "dotenv";
import { defineConfig } from "prisma/config";
import path from "path";

config({ path: path.join(process.cwd(), "backend", ".env") });

export default defineConfig({
  schema: "backend/prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
