import { Router } from "express";
import { UserRole } from "../../generated/prisma/index";
import { authenticate } from "../../middlewares/authenticate.ts";
import { authorize } from "../../middlewares/authorize.ts";
import { validate } from "../../middlewares/validate.ts";
import { create, list, update } from "./categories.controller.ts";
import {
  createCategorySchema,
  listCategoriesQuerySchema,
  updateCategorySchema,
} from "./categories.schemas.ts";
import { z } from "zod";

export const categoriesRouter = Router();

categoriesRouter.get(
  "/",
  authenticate,
  validate(z.object({ query: listCategoriesQuerySchema })),
  list
);
categoriesRouter.post(
  "/",
  authenticate,
  authorize(UserRole.ADMIN),
  validate(createCategorySchema),
  create
);
categoriesRouter.put(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  validate(updateCategorySchema),
  update
);
