import { config } from "dotenv";

config({ path: ".env.test" });

const databaseUrlTest = process.env["DATABASE_URL_TEST"];

if (!databaseUrlTest) {
  throw new Error(
    "DATABASE_URL_TEST is required to run integration tests. Copy .env.test.example to .env.test and run migrations against the test database."
  );
}

if (!databaseUrlTest.includes("test")) {
  throw new Error("DATABASE_URL_TEST must point to a dedicated test database.");
}

process.env["NODE_ENV"] = "test";
process.env["DATABASE_URL"] = databaseUrlTest;
process.env["JWT_SECRET"] = process.env["JWT_SECRET"] || "test-secret";
process.env["JWT_EXPIRES_IN"] = process.env["JWT_EXPIRES_IN"] || "1d";
