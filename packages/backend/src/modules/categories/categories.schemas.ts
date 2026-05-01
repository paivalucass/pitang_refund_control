import { z } from "zod";

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
