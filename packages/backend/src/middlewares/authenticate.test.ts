import type { NextFunction, Request } from "express";
import jwt from "jsonwebtoken";
import { UserRole } from "../generated/prisma/index";
import { AppError } from "../lib/AppError.ts";
import { env } from "../lib/env.ts";
import { authenticate } from "./authenticate.ts";

describe("authenticate middleware", () => {
  const payload = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    email: "user@example.com",
    role: UserRole.EMPLOYEE,
  };

  it("attaches the decoded user and calls next for a valid bearer token", () => {
    const token = jwt.sign(payload, env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } } as Request;
    const next = jest.fn() as NextFunction;

    authenticate(req, {} as never, next);

    expect(req.user).toEqual(payload);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("throws when the authorization header is missing", () => {
    const req = { headers: {} } as Request;

    expect(() => authenticate(req, {} as never, jest.fn())).toThrow(AppError);
    expect(() => authenticate(req, {} as never, jest.fn())).toThrow("Token de autenticação ausente");
  });

  it("throws when the token is invalid", () => {
    const req = { headers: { authorization: "Bearer invalid-token" } } as Request;

    expect(() => authenticate(req, {} as never, jest.fn())).toThrow("Token de autenticação inválido ou expirado");
  });
});
