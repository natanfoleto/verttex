import { ErrorCode } from "./error-codes";

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly statusCode: number = 400,
    public readonly details: unknown = null,
    public readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
