import type { Request, Response } from "express";
import * as authService from "./auth.service.ts";

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  res.json(result);
}
