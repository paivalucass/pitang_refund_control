import type { NextFunction, Request, Response } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import type { ParsedQs } from "qs";
import type { z } from "zod";

type RequestSchema = z.ZodObject<{
  body?: z.ZodType;
  params?: z.ZodType;
  query?: z.ZodType;
}>;

type RequestWithValidatedQuery = Request & {
  validatedQuery?: unknown;
};

export function validate(schema: RequestSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.parse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (parsed.body) req.body = parsed.body;
    if (parsed.params) req.params = parsed.params as ParamsDictionary;
    if (parsed.query) {
      (req as RequestWithValidatedQuery).validatedQuery = parsed.query;
      Object.assign(req.query, parsed.query as ParsedQs);
    }

    next();
  };
}
