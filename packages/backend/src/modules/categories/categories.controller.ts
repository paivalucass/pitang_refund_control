import type { Request, Response } from "express";
import { getValidatedQuery } from "../../lib/pagination.ts";
import type { ListCategoriesQuery } from "./categories.schemas.ts";
import * as categoriesService from "./categories.service.ts";

function getId(req: Request): string {
  return req.params.id as string;
}

export async function list(req: Request, res: Response): Promise<void> {
  const categories = await categoriesService.listCategories(getValidatedQuery<ListCategoriesQuery>(req));
  res.json(categories);
}

export async function create(req: Request, res: Response): Promise<void> {
  const category = await categoriesService.createCategory(req.body);
  res.status(201).json(category);
}

export async function update(req: Request, res: Response): Promise<void> {
  const category = await categoriesService.updateCategory(getId(req), req.body);
  res.json(category);
}
