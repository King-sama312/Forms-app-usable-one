import rateLimit, { ipKeyGenerator } from "express-rate-limit";

const WINDOW = 15 * 60 * 1000; // 15 minutes

export const loginIpLimiter = rateLimit({
  windowMs: WINDOW,
  limit: 30,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

export const loginAccountLimiter = rateLimit({
  windowMs: WINDOW,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    return `${ipKeyGenerator(req.ip!)}:${email}`;
  },
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});