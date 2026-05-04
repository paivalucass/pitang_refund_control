import type { NextFunction, Request } from "express";
import { UserRole } from "../generated/prisma/index";
import { authorize } from "./authorize.ts";

describe("authorize middleware", () => {
  it("calls next when the authenticated user has an allowed role", () => {
    const req = { user: { id: "1", email: "manager@example.com", role: UserRole.MANAGER } } as unknown as Request;
    const next = jest.fn() as NextFunction;

    authorize(UserRole.MANAGER, UserRole.ADMIN)(req, {} as never, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("throws when the request is not authenticated", () => {
    const req = {} as Request;

    expect(() => authorize(UserRole.ADMIN)(req, {} as never, jest.fn())).toThrow("Usuário não autenticado");
  });

  it("throws when the user role is not allowed", () => {
    const req = { user: { id: "1", email: "employee@example.com", role: UserRole.EMPLOYEE } } as unknown as Request;

    expect(() => authorize(UserRole.ADMIN)(req, {} as never, jest.fn())).toThrow("Usuário sem permissão");
  });
});
