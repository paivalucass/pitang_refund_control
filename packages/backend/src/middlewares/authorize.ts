import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "../generated/prisma";
import { AppError } from "../lib/AppError.ts";

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError("Usuário não autenticado", 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError("Usuário sem permissão para executar esta ação", 403);
    }

    next();
  };
}
