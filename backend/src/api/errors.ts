export class ApiError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    readonly safeMessage: string
  ) {
    super(safeMessage);
    this.name = "ApiError";
  }
}

export function notFound(message = "The requested record was not found."): ApiError {
  return new ApiError(404, "not_found", message);
}

export function invalidInput(message = "The request parameters are invalid."): ApiError {
  return new ApiError(422, "validation_failed", message);
}

export function conflict(code: string, message: string): ApiError {
  return new ApiError(409, code, message);
}

export function dependencyUnavailable(code: string, message: string): ApiError {
  return new ApiError(503, code, message);
}

export function corruptRecord(): ApiError {
  return new ApiError(500, "record_unavailable", "The requested record could not be read.");
}
