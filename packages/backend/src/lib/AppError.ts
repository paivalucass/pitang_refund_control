export class AppError extends Error {
  public readonly statusCode: number;
  public readonly error: string;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    this.error = AppError.getErrorLabel(statusCode);
    Object.setPrototypeOf(this, AppError.prototype);
  }

  private static getErrorLabel(statusCode: number): string {
    const labels: Record<number, string> = {
      400: "Bad Request",
      401: "Unauthorized",
      403: "Forbidden",
      404: "Not Found",
      409: "Conflict",
      500: "Internal Server Error",
    };
    return labels[statusCode] || "Error";
  }

  public toJSON() {
    return {
      message: this.message,
      statusCode: this.statusCode,
      error: this.error,
    };
  }
}
