import { defineConfig } from "prisma/config";
import path from "path";
import dotenv from "dotenv";

// Load .env.local so Prisma CLI can find DATABASE_URL
dotenv.config({ path: path.resolve(__dirname, ".env.local") });
dotenv.config({ path: path.resolve(__dirname, ".env") });

export default defineConfig({
  datasourceUrl: process.env.DATABASE_URL,
});
