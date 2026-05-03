import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    email: z.email(),
    password: z.string().min(1, "Senha é obrigatória"),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token é obrigatório"),
  }),
});
