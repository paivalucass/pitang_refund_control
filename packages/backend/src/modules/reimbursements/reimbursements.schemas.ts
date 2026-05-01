import { z } from "zod";
import { AttachmentType } from "../../generated/prisma";

export const reimbursementParamsSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
});

export const createReimbursementSchema = z.object({
  body: z.object({
    categoryId: z.uuid(),
    description: z.string().trim().min(1, "Descrição é obrigatória"),
    amount: z.coerce.number().positive("Valor deve ser maior que zero"),
    expenseDate: z.coerce.date(),
  }),
});

export const updateReimbursementSchema = z.object({
  params: reimbursementParamsSchema.shape.params,
  body: z
    .object({
      categoryId: z.uuid().optional(),
      description: z.string().trim().min(1, "Descrição é obrigatória").optional(),
      amount: z.coerce.number().positive("Valor deve ser maior que zero").optional(),
      expenseDate: z.coerce.date().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "Informe ao menos um campo para atualização",
    }),
});

export const rejectReimbursementSchema = z.object({
  params: reimbursementParamsSchema.shape.params,
  body: z.object({
    rejectionReason: z
      .string()
      .trim()
      .min(1, "Justificativa de rejeição é obrigatória"),
  }),
});

export const attachmentSchema = z.object({
  params: reimbursementParamsSchema.shape.params,
  body: z.object({
    fileName: z.string().trim().min(1, "Nome do arquivo é obrigatório"),
    fileUrl: z.string().trim().min(1, "URL do arquivo é obrigatória"),
    fileType: z.enum(AttachmentType),
  }),
});
