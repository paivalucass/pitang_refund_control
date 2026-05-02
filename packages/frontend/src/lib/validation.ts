import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Informe e-mail e senha.')
    .email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe e-mail e senha.'),
})

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Preencha todos os campos obrigatórios.'),
  email: z
    .string()
    .trim()
    .min(1, 'Preencha todos os campos obrigatórios.')
    .email('Informe um e-mail válido.'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres.'),
  role: z.enum(['EMPLOYEE', 'MANAGER', 'FINANCE', 'ADMIN']),
})

export const passwordSchema = registerSchema.shape.password

export const reimbursementSchema = z.object({
  categoryId: z.string().min(1, 'Preencha todos os campos obrigatórios.'),
  description: z.string().trim().min(1, 'Preencha todos os campos obrigatórios.'),
  amount: z.coerce.number().positive('O valor deve ser maior que zero.'),
  expenseDate: z.string().min(1, 'Preencha todos os campos obrigatórios.'),
})

export function firstZodError(error: z.ZodError) {
  return error.issues[0]?.message ?? 'Verifique os campos informados.'
}
