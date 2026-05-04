import { AppError } from "./AppError.ts";

describe("AppError", () => {
  it("creates a bad request error by default", () => {
    const error = new AppError("Dados inválidos");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(400);
    expect(error.error).toBe("Bad Request");
    expect(error.toJSON()).toEqual({
      message: "Dados inválidos",
      statusCode: 400,
      error: "Bad Request",
    });
  });

  it("maps known status codes to their labels", () => {
    expect(new AppError("Sem autenticação", 401).error).toBe("Unauthorized");
    expect(new AppError("Sem permissão", 403).error).toBe("Forbidden");
    expect(new AppError("Não encontrado", 404).error).toBe("Not Found");
    expect(new AppError("Conflito", 409).error).toBe("Conflict");
    expect(new AppError("Falha", 500).error).toBe("Internal Server Error");
  });

  it("uses a generic label for unknown status codes", () => {
    expect(new AppError("Indisponível", 503).toJSON()).toEqual({
      message: "Indisponível",
      statusCode: 503,
      error: "Error",
    });
  });
});
