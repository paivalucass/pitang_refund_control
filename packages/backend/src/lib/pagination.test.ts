import type { Request } from "express";
import {
  getPagination,
  getPaginationQuery,
  getValidatedQuery,
  paginatedResponse,
} from "./pagination.ts";

describe("pagination helpers", () => {
  it("calculates skip and take from page and limit", () => {
    expect(getPagination(1, 10)).toEqual({ skip: 0, take: 10 });
    expect(getPagination(4, 25)).toEqual({ skip: 75, take: 25 });
  });

  it("parses pagination query values with defaults", () => {
    expect(getPaginationQuery({ query: {} } as Request)).toEqual({ page: 1, limit: 10 });
    expect(getPaginationQuery({ query: { page: "3", limit: "20" } } as unknown as Request)).toEqual({
      page: 3,
      limit: 20,
    });
  });

  it("prefers validated query values already attached to the request", () => {
    const req = { query: { page: "1", limit: "10" }, validatedQuery: { page: 2, limit: 5 } } as unknown as Request;

    expect(getPaginationQuery(req)).toEqual({ page: 2, limit: 5 });
    expect(getValidatedQuery<{ page: number; limit: number }>(req)).toEqual({ page: 2, limit: 5 });
  });

  it("wraps data with pagination metadata", () => {
    expect(paginatedResponse(["a", "b"], { page: 2, limit: 2, total: 5 })).toEqual({
      data: ["a", "b"],
      meta: {
        page: 2,
        limit: 2,
        total: 5,
        totalPages: 3,
      },
    });
  });
});
