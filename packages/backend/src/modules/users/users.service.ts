import bcrypt from "bcryptjs";
import { Prisma } from "../../generated/prisma/index";
import { AppError } from "../../lib/AppError.ts";
import { prisma } from "../../lib/prisma.ts";

type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role: Prisma.UserCreateInput["role"];
};

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
};

export async function createUser(data: CreateUserInput) {
  const passwordHash = await bcrypt.hash(data.password, 10);

  try {
    return await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role,
      },
      select: userSelect,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError("E-mail já cadastrado", 409);
    }

    throw error;
  }
}

export async function listUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: userSelect,
  });
}
