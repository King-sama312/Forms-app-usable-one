import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "../api.error.js";
import { getAccessCookie } from "../utils/cookies.js";

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const token = getAccessCookie(req);
  if (!token) throw ApiError.unauthorized("Not authenticated");

  try {
    const payload = jwt.verify(
      token,
      process.env.ACCESS_SECRET!,
    ) as jwt.JwtPayload;
    req.user = { id: Number(payload.sub) };
    next();
  } catch {
    throw ApiError.unauthorized("Invalid or expired token");
  }
}

export function optionalAuthenticate(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!getAccessCookie(req)) return next(); // anonymous
  authenticate(req, res, next); // there is a cookie, so it must be valid
}

