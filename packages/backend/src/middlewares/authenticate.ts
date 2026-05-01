import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { UserRole } from "../generated/prisma";
import { AppError } from "../lib/AppError.ts";
import { env } from "../lib/env.ts";

const tokenPayloadSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  role: z.enum(UserRole),
});

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    throw new AppError("Token de autenticação ausente", 401);
  }

  const token = authorization.replace("Bearer ", "").trim();

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = tokenPayloadSchema.parse(decoded);
    next();
  } catch {
    throw new AppError("Token de autenticação inválido ou expirado", 401);
  }
}
