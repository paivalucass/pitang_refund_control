import { z } from "zod";
import { UserRole } from "../../generated/prisma";

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Nome é obrigatório"),
    email: z.email(),
    password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
    role: z.enum(UserRole),
  }),
});
