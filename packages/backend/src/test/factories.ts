import bcrypt from "bcryptjs";
import request from "supertest";
import { app } from "../../app.ts";
import {
  Prisma,
  RequestStatus,
  UserRole,
  type Category,
  type Reimbursement,
  type User,
  type UserRole as UserRoleType,
} from "../generated/prisma/index";
import { prisma } from "../lib/prisma.ts";

let sequence = 0;

export function uniqueEmail(prefix: string): string {
  sequence += 1;
  return `${prefix}.${Date.now()}.${sequence}@example.com`;
}

export async function createUser(
  role: UserRoleType = UserRole.EMPLOYEE,
  overrides: Partial<Pick<User, "name" | "email">> & { password?: string } = {}
) {
  const password = overrides.password ?? "password123";
  const user = await prisma.user.create({
    data: {
      name: overrides.name ?? `${role} User`,
      email: overrides.email ?? uniqueEmail(role.toLowerCase()),
      passwordHash: await bcrypt.hash(password, 10),
      role,
    },
  });

  return { user, password };
}

export async function loginUser(email: string, password: string): Promise<string> {
  const response = await request(app).post("/auth/login").send({ email, password });
  return response.body.token;
}

export async function createUserAndToken(role: UserRoleType = UserRole.EMPLOYEE) {
  const { user, password } = await createUser(role);
  const token = await loginUser(user.email, password);
  return { user, password, token };
}

export function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function createCategory(
  overrides: Partial<Pick<Category, "name" | "active">> & {
    valueLimit?: Prisma.Decimal | number | string | null;
  } = {}
): Promise<Category> {
  sequence += 1;

  return prisma.category.create({
    data: {
      name: overrides.name ?? `Category ${Date.now()} ${sequence}`,
      active: overrides.active ?? true,
      valueLimit: overrides.valueLimit,
    },
  });
}

export async function createReimbursement(
  requesterId: string,
  categoryId: string,
  overrides: Partial<
    Pick<Reimbursement, "description" | "amount" | "expenseDate" | "status">
  > = {}
): Promise<Reimbursement> {
  return prisma.reimbursement.create({
    data: {
      requesterId,
      categoryId,
      description: overrides.description ?? "Taxi ride",
      amount: overrides.amount ?? "42.50",
      expenseDate: overrides.expenseDate ?? new Date("2026-04-20T12:00:00.000Z"),
      status: overrides.status ?? RequestStatus.DRAFT,
    },
  });
}
