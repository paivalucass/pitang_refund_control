import { z } from "zod";
import { UserRole } from "../../generated/prisma";
import { paginationQuerySchema } from "../../lib/pagination.ts";

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Nome é obrigatório"),
    email: z.email(),
    password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
    role: z.enum(UserRole),
  }),
});

export const listUsersQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().optional(),
  role: z.enum(UserRole).optional(),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
