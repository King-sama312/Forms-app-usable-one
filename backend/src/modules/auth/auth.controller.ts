import type { Response, Request } from "express";
import * as authServices from "./auth.services.js";
import { ApiError } from "../../common/api.error.js";
import {
  setAuthCookies,
  clearAuthCookies,
  getRefreshCookie,
} from "../../common/utils/cookies.js";
import { loginSchema, registerSchema } from "./auth.model.js";

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success)
    throw ApiError.badRequest(
      parsed.error.issues.map((i) => i.message).join(", "),
    );

  const { user, accessToken, refreshToken, refreshExpiresAt } =
    await authServices.register(parsed.data);

  setAuthCookies(res, { accessToken, refreshToken, refreshExpiresAt });
  res.status(201).json({ user });
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) throw ApiError.badRequest(String(parsed.error.issues));

  const { user, ...session } = await authServices.login(parsed.data);
  setAuthCookies(res, session);

  res.status(200).json({ user });
}

export async function refresh(req: Request, res: Response) {
  const token = getRefreshCookie(req);
  if (!token) throw ApiError.unauthorized("Refresh token missing");

  try {
    const session = await authServices.refresh(token);
    setAuthCookies(res, session);
    res.sendStatus(204);
  } catch (e) {
    clearAuthCookies(res);
    throw e;
  }
}

export async function logout(req: Request, res: Response) {
  const token = getRefreshCookie(req);
  if (token) await authServices.logout(token);

  clearAuthCookies(res);
  res.sendStatus(204);
}

export async function logoutAll(req: Request, res: Response) {
  await authServices.logoutAll(req.user!.id);
  clearAuthCookies(res);
  res.sendStatus(204);
}

export async function getMe(req: Request, res: Response) {
  res.json({ user: await authServices.getMe(req.user!.id) });
}
