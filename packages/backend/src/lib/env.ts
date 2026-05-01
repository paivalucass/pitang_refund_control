import "dotenv/config";

export const env = {
  DATABASE_URL: process.env["DATABASE_URL"]!,
  JWT_SECRET: process.env["JWT_SECRET"] || "fallback-secret",
  JWT_EXPIRES_IN: process.env["JWT_EXPIRES_IN"] || "1d",
  PORT: Number(process.env["PORT"]) || 3000,
  NODE_ENV: process.env["NODE_ENV"] || "development",
};
