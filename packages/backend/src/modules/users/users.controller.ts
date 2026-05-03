import type { Request, Response } from "express";
import { getValidatedQuery } from "../../lib/pagination.ts";
import type { ListUsersQuery } from "./users.schemas.ts";
import * as usersService from "./users.service.ts";

export async function create(req: Request, res: Response): Promise<void> {
  const user = await usersService.createUser(req.body);
  res.status(201).json(user);
}

export async function list(req: Request, res: Response): Promise<void> {
  const users = await usersService.listUsers(getValidatedQuery<ListUsersQuery>(req));
  res.json(users);
}
