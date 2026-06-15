class ErrorResponse extends Error {
  public statusCode: number;
  public errors: Record<string, string[] | undefined> | string[] | null;

  constructor(
    message: string,
    statusCode: number,
    errors: Record<string, string[] | undefined> | string[] | null = null,
  ) {
    super(message);

    this.statusCode = statusCode;
    this.errors = errors;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ErrorResponse;
