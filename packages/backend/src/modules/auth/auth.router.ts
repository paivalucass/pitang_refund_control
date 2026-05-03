import { Router } from "express";
import { login, refresh } from "./auth.controller.ts";
import { validate } from "../../middlewares/validate.ts";
import { loginSchema, refreshSchema } from "./auth.schemas.ts";

export const authRouter = Router();

authRouter.post("/login", validate(loginSchema), login);
authRouter.post("/refresh", validate(refreshSchema), refresh);
