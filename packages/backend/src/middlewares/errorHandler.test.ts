import { z } from "zod";
import { AppError } from "../lib/AppError.ts";
import { errorHandler } from "./errorHandler.ts";

function createResponse() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res;
}

describe("errorHandler middleware", () => {
  it("serializes AppError instances", () => {
    const res = createResponse();

    errorHandler(new AppError("Sem permissão", 403), {} as never, res as never, jest.fn());

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "Sem permissão",
      statusCode: 403,
      error: "Forbidden",
    });
  });

  it("maps ZodError issues to validation details", () => {
    const res = createResponse();
    const result = z.object({ email: z.email() }).safeParse({ email: "invalid" });

    errorHandler(result.error!, {} as never, res as never, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Validation failed",
        statusCode: 400,
        error: "Bad Request",
        details: [expect.objectContaining({ field: "email" })],
      })
    );
  });

  it("returns a generic 500 response for unexpected errors", () => {
    const res = createResponse();
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    errorHandler(new Error("boom"), {} as never, res as never, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Internal server error",
      statusCode: 500,
      error: "Internal Server Error",
    });

    consoleSpy.mockRestore();
  });
});
