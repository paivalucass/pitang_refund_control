import type { Request } from "express";
import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

type RequestWithValidatedQuery = Request & {
  validatedQuery?: unknown;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export function getPagination(page: number, limit: number) {
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}

export function getPaginationQuery(req: Request): PaginationQuery {
  return ((req as RequestWithValidatedQuery).validatedQuery ?? paginationQuerySchema.parse(req.query)) as PaginationQuery;
}

export function getValidatedQuery<T>(req: Request): T {
  return (req as RequestWithValidatedQuery).validatedQuery as T;
}

export function paginatedResponse<T>(
  data: T[],
  { page, limit, total }: PaginationQuery & { total: number }
): PaginatedResponse<T> {
  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
