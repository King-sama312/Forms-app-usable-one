import type { Request, Response, NextFunction } from "express";
import { authenticate } from "./authenticate.js";
import { getAccessCookie } from "../utils/cookies.js";
export function optionalAuthenticate(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!getAccessCookie(req)) return next(); // anonymous
  authenticate(req, res, next); // there is a cookie, so it must be valid
}
