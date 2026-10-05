import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { prisma } from "../../prisma.js";
import { Prisma } from "../../../generated/prisma/client.js";
import { ApiError } from "../../common/api.error.js";
import type { LoginBody, RegisterBody } from "./auth.model.js";
import {
  ACCESS_TTL_SECONDS,
  REFRESH_TTL_MS,
} from "../../common/auth.config.js";

const ACCESS_SECRET = process.env.ACCESS_SECRET!;
const BCRYPT_ROUNDS = 12;
const DUMMY_HASH = bcrypt.hashSync("dummy-password", BCRYPT_ROUNDS);

type Db = Prisma.TransactionClient | typeof prisma;

const hashToken = (token: string) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const signAccessToken = (userId: number) => {
  return jwt.sign({}, ACCESS_SECRET, {
    subject: String(userId),
    expiresIn: ACCESS_TTL_SECONDS,
  });
};

async function createSession(userId: number, db: Db = prisma) {
  const refreshToken = crypto.randomBytes(48).toString("base64url");
  const refreshExpiresAt = new Date(Date.now() + REFRESH_TTL_MS);

  await db.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt: refreshExpiresAt,
    },
  });

  return {
    accessToken: signAccessToken(userId),
    refreshToken,
    refreshExpiresAt,
  };
}

// Register
export async function register({ email, password }: RegisterBody) {
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, passwordHash },
        select: { id: true, email: true },
      });

      const session = await createSession(user.id, tx);
      return { user, ...session };
    });

    return result;
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      throw ApiError.conflict("Email already exists");
    }
    throw e;
  }
}

// Login
export async function login({ email, password }: LoginBody) {
  const user = await prisma.user.findUnique({ where: { email } });

  const valid = await bcrypt.compare(
    password,
    user?.passwordHash ?? DUMMY_HASH,
  );

  if (!user || !valid) throw ApiError.unauthorized("Invalid credentials");

  const session = await createSession(user.id);

  return {
    user: { id: user.id, email: user.email },
    ...session,
  };
}

// Refresh
export async function refresh(token: string) {
  const tokenHash = hashToken(token);

  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!stored) throw ApiError.unauthorized("Invalid refresh token");

  // if theft detected, revoke all tokens
  if (stored.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { userId: stored.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    throw ApiError.unauthorized("Invalid refresh token");
  }

  if (stored.expiresAt < new Date())
    throw ApiError.unauthorized("Refresh token expired");

  return prisma.$transaction(async (tx) => {
    const { count } = await tx.refreshToken.updateMany({
      where: { id: stored.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    if (count !== 1) throw ApiError.unauthorized("Invalid refresh token");

    return createSession(stored.userId, tx);
  });
}

// Logout
export async function logout(token: string) {
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(token), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

// Logout from all devices
export async function logoutAll(userId: number) {
  await prisma.refreshToken.updateMany({
    where: { userId: userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getMe(userId: number) {
  const user = await  prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });

  if (!user) throw ApiError.unauthorized("User no longer exists");
  return user;
}
