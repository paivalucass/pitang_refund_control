import { Router } from "express";
import { login } from "./auth.controller.ts";
import { validate } from "../../middlewares/validate.ts";
import { loginSchema } from "./auth.schemas.ts";

export const authRouter = Router();

authRouter.post("/login", validate(loginSchema), login);
