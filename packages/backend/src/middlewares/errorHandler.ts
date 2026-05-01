import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../lib/AppError.js";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(err.toJSON());
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      message: "Validation failed",
      statusCode: 400,
      error: "Bad Request",
      details: err.error.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
    return;
  }

  console.error("Unexpected error:", err);

  res.status(500).json({
    message: "Internal server error",
    statusCode: 500,
    error: "Internal Server Error",
  });
}
