import "dotenv/config";

export const env = {
  DATABASE_URL: process.env["DATABASE_URL"]!,
  JWT_SECRET: process.env["JWT_SECRET"] || "fallback-secret",
  JWT_EXPIRES_IN: process.env["JWT_EXPIRES_IN"] || "1d",
  PORT: Number(process.env["PORT"]) || 3000,
  NODE_ENV: process.env["NODE_ENV"] || "development",
  SUPABASE_URL: process.env["SUPABASE_URL"] || "",
  SUPABASE_ANON_KEY: process.env["SUPABASE_ANON_KEY"] || "",
  SUPABASE_ATTACHMENTS_BUCKET: process.env["SUPABASE_ATTACHMENTS_BUCKET"] || "attachments",
};
