import { z } from "zod";
import { paginationQuerySchema } from "../../lib/pagination.ts";

export const categoryParamsSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
});

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Nome é obrigatório"),
  }),
});

export const updateCategorySchema = z.object({
  params: categoryParamsSchema.shape.params,
  body: z
    .object({
      name: z.string().trim().min(1, "Nome é obrigatório").optional(),
      active: z.boolean().optional(),
    })
    .refine((data) => data.name !== undefined || data.active !== undefined, {
      message: "Informe ao menos um campo para atualização",
    }),
});

export const listCategoriesQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().optional(),
  active: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
});

export type ListCategoriesQuery = z.infer<typeof listCategoriesQuerySchema>;
