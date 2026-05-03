import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppError } from "../../lib/AppError.ts";
import { env } from "../../lib/env.ts";
import { prisma } from "../../lib/prisma.ts";

type AuthTokenPayload = {
  id: string;
  email: string;
  role: string;
};

const REFRESH_TOKEN_EXPIRES_IN = "7d";

function signAccessToken(payload: AuthTokenPayload) {
  return jwt.sign(
    payload,
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] }
  );
}

function signRefreshToken(payload: AuthTokenPayload) {
  return jwt.sign(
    { ...payload, tokenType: "refresh" },
    env.JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );
}

function getSafeUser(user: {
  id: string;
  name: string;
  email: string;
  role: AuthTokenPayload["role"];
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new AppError("Credenciais inválidas", 401);
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError("Credenciais inválidas", 401);
  }

  const payload = { id: user.id, email: user.email, role: user.role };

  return {
    token: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    user: getSafeUser(user),
  };
}

export async function refresh(refreshToken: string) {
  try {
    const decoded = jwt.verify(refreshToken, env.JWT_SECRET) as AuthTokenPayload & {
      tokenType?: string;
    };

    if (decoded.tokenType !== "refresh") {
      throw new AppError("Refresh token inválido ou expirado", 401);
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user || user.email !== decoded.email || user.role !== decoded.role) {
      throw new AppError("Refresh token inválido ou expirado", 401);
    }

    const payload = { id: user.id, email: user.email, role: user.role };

    return {
      token: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
      user: getSafeUser(user),
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("Refresh token inválido ou expirado", 401);
  }
}
