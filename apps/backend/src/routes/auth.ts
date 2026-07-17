import { Router } from "express";
import {
  forgotPasswordSchema,
  refreshTokenSchema,
  resetPasswordSchema,
  signinSchema,
  signupSchema,
} from "@journal-iq/shared";
import { prisma } from "../lib/prisma";
import {
  createAccessToken,
  createPasswordResetToken,
  createRefreshTokenValue,
  hashPassword,
  hashToken,
  verifyPassword,
} from "../lib/tokens";
import { env } from "../config/env";
import { AppError, asyncHandler } from "../middleware/error";
import { sendPasswordResetEmail } from "../services/email";
import type { AuthRequest } from "../middleware/auth";
import { authenticate } from "../middleware/auth";

const router = Router();

async function issueTokens(user: { id: string; email: string; name: string }) {
  const accessToken = createAccessToken({ userId: user.id, email: user.email });
  const refreshToken = createRefreshTokenValue();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.JWT_REFRESH_EXPIRES_DAYS);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt,
    },
  });

  return {
    user: { id: user.id, email: user.email, name: user.name },
    accessToken,
    refreshToken,
  };
}

router.post(
  "/signup",
  asyncHandler(async (req, res) => {
    const data = signupSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (existing) throw new AppError(409, "Email already registered");

    const user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email: data.email.toLowerCase(),
        passwordHash: await hashPassword(data.password),
      },
    });

    const tokens = await issueTokens(user);
    res.status(201).json(tokens);
  })
);

router.post(
  "/signin",
  asyncHandler(async (req, res) => {
    const data = signinSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (!user || !(await verifyPassword(data.password, user.passwordHash))) {
      throw new AppError(401, "Invalid email or password");
    }
    res.json(await issueTokens(user));
  })
);

router.post(
  "/signout",
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const refreshToken =
      typeof req.body?.refreshToken === "string" ? req.body.refreshToken : null;
    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: {
          userId: req.user!.userId,
          tokenHash: hashToken(refreshToken),
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
    } else {
      await prisma.refreshToken.updateMany({
        where: { userId: req.user!.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    res.json({ ok: true });
  })
);

router.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const { refreshToken } = refreshTokenSchema.parse(req.body);
    const tokenHash = hashToken(refreshToken);
    const stored = await prisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null },
      include: { user: true },
    });
    if (!stored || stored.expiresAt < new Date()) {
      throw new AppError(401, "Invalid refresh token");
    }

    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    res.json(await issueTokens(stored.user));
  })
);

router.post(
  "/forgot-password",
  asyncHandler(async (req, res) => {
    const { email } = forgotPasswordSchema.parse(req.body);
    const normalized = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalized },
    });

    // Always return ok to avoid account enumeration.
    if (!user) {
      res.json({ ok: true });
      return;
    }

    // Invalidate unused prior tokens for this user.
    await prisma.passwordReset.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = createPasswordResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt,
      },
    });

    try {
      await sendPasswordResetEmail(user.email, token);
    } catch (err) {
      console.error("[Journal IQ] forgot-password email failed:", err);
      // Do not leak delivery failures to the client (enumeration / probing).
    }

    res.json({ ok: true });
  })
);

router.post(
  "/reset-password",
  asyncHandler(async (req, res) => {
    const { token, password } = resetPasswordSchema.parse(req.body);
    const tokenHash = hashToken(token);
    const reset = await prisma.passwordReset.findFirst({
      where: { tokenHash, usedAt: null },
    });
    if (!reset || reset.expiresAt < new Date()) {
      throw new AppError(400, "This reset link is invalid or has expired. Request a new one.");
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: reset.userId },
        data: { passwordHash: await hashPassword(password) },
      }),
      prisma.passwordReset.update({
        where: { id: reset.id },
        data: { usedAt: new Date() },
      }),
      // Invalidate any other outstanding reset tokens for this account.
      prisma.passwordReset.updateMany({
        where: { userId: reset.userId, usedAt: null, id: { not: reset.id } },
        data: { usedAt: new Date() },
      }),
      prisma.refreshToken.updateMany({
        where: { userId: reset.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    res.json({ ok: true });
  })
);

export default router;
