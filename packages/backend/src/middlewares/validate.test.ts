import type { Request } from "express";
import { z } from "zod";
import { validate } from "./validate.ts";

describe("validate middleware", () => {
  it("replaces body, params, and query with parsed values", () => {
    const req = {
      body: { name: "  Alimentação  " },
      params: { id: "550e8400-e29b-41d4-a716-446655440000" },
      query: { page: "2" },
    } as unknown as Request;
    const next = jest.fn();

    validate(
      z.object({
        body: z.object({ name: z.string().trim() }),
        params: z.object({ id: z.uuid() }),
        query: z.object({ page: z.coerce.number().int() }),
      })
    )(req, {} as never, next);

    expect(req.body).toEqual({ name: "Alimentação" });
    expect(req.params).toEqual({ id: "550e8400-e29b-41d4-a716-446655440000" });
    expect(req.query).toMatchObject({ page: 2 });
    expect((req as Request & { validatedQuery?: unknown }).validatedQuery).toEqual({ page: 2 });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("throws zod errors for invalid requests", () => {
    const middleware = validate(z.object({ body: z.object({ email: z.email() }) }));
    const req = { body: { email: "invalid" }, params: {}, query: {} } as Request;

    expect(() => middleware(req, {} as never, jest.fn())).toThrow(z.ZodError);
  });
});
