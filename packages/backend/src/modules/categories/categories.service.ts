import { Prisma } from "../../generated/prisma/index";
import { AppError } from "../../lib/AppError.ts";
import { getPagination, paginatedResponse } from "../../lib/pagination.ts";
import { prisma } from "../../lib/prisma.ts";
import type { ListCategoriesQuery } from "./categories.schemas.ts";

type CreateCategoryInput = {
  name: string;
  valueLimit?: number | null;
};

type UpdateCategoryInput = {
  name?: string;
  active?: boolean;
  valueLimit?: number | null;
};

export async function listCategories({ page, limit, search, active }: ListCategoriesQuery) {
  const { skip, take } = getPagination(page, limit);
  const where: Prisma.CategoryWhereInput = {
    ...(active !== undefined ? { active } : {}),
    ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
  };
  const data = await prisma.category.findMany({
    skip,
    take,
    where,
    orderBy: { name: "asc" },
  });
  const total = await prisma.category.count({ where });

  return paginatedResponse(data, { page, limit, total });
}

export async function createCategory(data: CreateCategoryInput) {
  try {
    return await prisma.category.create({ data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError("Categoria já cadastrada", 409);
    }

    throw error;
  }
}

export async function updateCategory(id: string, data: UpdateCategoryInput) {
  const category = await prisma.category.findUnique({ where: { id } });

  if (!category) {
    throw new AppError("Categoria não encontrada", 404);
  }

  try {
    return await prisma.category.update({
      where: { id },
      data,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError("Categoria já cadastrada", 409);
    }

    throw error;
  }
}
