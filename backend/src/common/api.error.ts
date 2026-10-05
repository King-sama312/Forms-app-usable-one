export type HttpStatusCode =
  200 | 201 | 202 | 204 | 400 | 401 | 403 | 404 | 409 | 412 | 500 | 502 | 503;

export class ApiError extends Error {
  statusCode: HttpStatusCode;
  constructor(statusCode: HttpStatusCode, message: string) {
    super(message);
    this.statusCode = statusCode;
    // this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = "Bad request") {
    return new ApiError(400, message);
  }

  static unauthorized(message = "Unauthorized") {
    return new ApiError(401, message);
  }
  static conflict(message = "Conflict") {
    return new ApiError(409, message);
  }
  static forbidden(message = "forbidden") {
    return new ApiError(403, message);
  }
  static notFound(message = "Not found") {
    return new ApiError(404, message);
  }
}
