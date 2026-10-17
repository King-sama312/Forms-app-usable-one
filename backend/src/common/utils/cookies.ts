import type { CookieOptions, Response, Request } from "express";
import { ACCESS_TTL_SECONDS, REFRESH_TTL_MS } from "../auth.config.js";
import { env } from "../env.js";
const ACCESS_COOKIE = "accessToken";
const REFRESH_COOKIE = "refreshToken";

const base: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict",
};

const accessOptions: CookieOptions = { ...base, path: "/" };
const refreshOptions: CookieOptions = { ...base, path: "/api/auth" };

type Session = {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
};

export const setAuthCookies = (res: Response, s: Session) => {
  res.cookie(ACCESS_COOKIE, s.accessToken, {
    ...accessOptions,
    maxAge: ACCESS_TTL_SECONDS * 1000,
  });
  res.cookie(REFRESH_COOKIE, s.refreshToken, {
    ...refreshOptions,
    expires: s.refreshExpiresAt,
  });
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie(ACCESS_COOKIE, accessOptions);
  res.clearCookie(REFRESH_COOKIE, refreshOptions);
};

export const getAccessCookie = (req: Request): string | undefined =>
  req.cookies?.[ACCESS_COOKIE];
export const getRefreshCookie = (req: Request): string | undefined =>
  req.cookies?.[REFRESH_COOKIE];
