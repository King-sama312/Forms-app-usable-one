import type { Request, Response, NextFunction } from "express";

import { ApiError } from "../api.error.js";

export function errorMiddleware(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      message: error.message,
    });
  }

  console.log(error);
  return res.status(500).json({
    message: "Internal server error",
  });
}
