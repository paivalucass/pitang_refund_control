import { Router } from "express";
import { UserRole } from "../../generated/prisma/index";
import { authenticate } from "../../middlewares/authenticate.ts";
import { authorize } from "../../middlewares/authorize.ts";
import { validate } from "../../middlewares/validate.ts";
import { paginationQuerySchema } from "../../lib/pagination.ts";
import { create, list } from "./users.controller.ts";
import { createUserSchema } from "./users.schemas.ts";
import { z } from "zod";

export const usersRouter = Router();

usersRouter.post("/", validate(createUserSchema), create);
usersRouter.get(
  "/",
  authenticate,
  authorize(UserRole.ADMIN),
  validate(z.object({ query: paginationQuerySchema })),
  list
);
