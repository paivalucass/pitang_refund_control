import type { Request, Response } from "express";
import * as usersService from "./users.service.ts";

export async function create(req: Request, res: Response): Promise<void> {
  const user = await usersService.createUser(req.body);
  res.status(201).json(user);
}

export async function list(_req: Request, res: Response): Promise<void> {
  const users = await usersService.listUsers();
  res.json(users);
}
