import { Router } from "express";
import {
  forgotPasswordSchema,
  LEGAL_CONSENT_VERSION,
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
  createTokenFamilyId,
  hashPassword,
  hashToken,
  verifyPassword,
} from "../lib/tokens";
import { env } from "../config/env";
import { AppError, asyncHandler } from "../middleware/error";
import { sendPasswordChangedEmail, sendPasswordResetEmail } from "../services/email";
import type { AuthRequest } from "../middleware/auth";
import { authenticate } from "../middleware/auth";

const router = Router();

type TokenUser = { id: string; email: string; name: string };

async function issueTokens(user: TokenUser, familyId?: string) {
  const accessToken = createAccessToken({ userId: user.id, email: user.email });
  const refreshToken = createRefreshTokenValue();
  const family = familyId ?? createTokenFamilyId();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.JWT_REFRESH_EXPIRES_DAYS);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      familyId: family,
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

async function revokeTokenFamily(familyId: string) {
  await prisma.refreshToken.updateMany({
    where: { familyId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

router.post(
  "/signup",
  asyncHandler(async (req, res) => {
    const data = signupSchema.parse(req.body);
    if (data.acceptedLegalVersion !== LEGAL_CONSENT_VERSION) {
      throw new AppError(
        400,
        "Please review and accept the latest Privacy Policy and Terms of Service."
      );
    }

    const email = data.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email } });

    // Generic error — do not confirm whether the email is registered.
    if (existing) {
      throw new AppError(
        400,
        "Unable to create account. Try signing in, or reset your password if you already registered."
      );
    }

    try {
      const user = await prisma.user.create({
        data: {
          name: data.name.trim(),
          email,
          passwordHash: await hashPassword(data.password),
          consentLegalVersion: LEGAL_CONSENT_VERSION,
          consentLegalAt: new Date(),
        },
      });
      const tokens = await issueTokens(user);
      res.status(201).json(tokens);
    } catch (err: unknown) {
      // Unique constraint race
      const code = err && typeof err === "object" && "code" in err ? (err as { code: string }).code : "";
      if (code === "P2002") {
        throw new AppError(
          400,
          "Unable to create account. Try signing in, or reset your password if you already registered."
        );
      }
      throw err;
    }
  })
);

router.post(
  "/signin",
  asyncHandler(async (req, res) => {
    const data = signinSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
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
      const hash = hashToken(refreshToken);
      const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: hash } });
      if (stored && stored.userId === req.user!.userId) {
        await revokeTokenFamily(stored.familyId);
      }
    } else {
      await prisma.refreshToken.updateMany({
        where: { userId: req.user!.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    res.json({ ok: true });
  })
);

/**
 * Atomic refresh with rotation + reuse detection.
 * Presenting an already-revoked token revokes the entire token family.
 * Concurrent claims use SELECT FOR UPDATE so only one rotation wins.
 */
router.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const { refreshToken } = refreshTokenSchema.parse(req.body);
    const tokenHash = hashToken(refreshToken);

    const result = await prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<
        Array<{
          id: string;
          userId: string;
          familyId: string;
          tokenHash: string;
          expiresAt: Date;
          revokedAt: Date | null;
        }>
      >`SELECT id, "userId", "familyId", "tokenHash", "expiresAt", "revokedAt"
        FROM "RefreshToken"
        WHERE "tokenHash" = ${tokenHash}
        FOR UPDATE`;

      const stored = rows[0];
      if (!stored) {
        throw new AppError(401, "Invalid refresh token");
      }

      const now = new Date();
      if (stored.expiresAt < now) {
        throw new AppError(401, "Invalid refresh token");
      }

      if (stored.revokedAt) {
        // Reuse of a rotated token — revoke the whole family.
        await tx.refreshToken.updateMany({
          where: { familyId: stored.familyId, revokedAt: null },
          data: { revokedAt: now },
        });
        console.warn(
          `[Journal IQ] Refresh token reuse detected; revoked family for user ${stored.userId}`
        );
        throw new AppError(401, "Invalid refresh token");
      }

      const claimed = await tx.refreshToken.updateMany({
        where: { id: stored.id, revokedAt: null },
        data: { revokedAt: now },
      });
      if (claimed.count === 0) {
        throw new AppError(401, "Invalid refresh token");
      }

      const user = await tx.user.findUniqueOrThrow({
        where: { id: stored.userId },
        select: { id: true, email: true, name: true },
      });

      const accessToken = createAccessToken({ userId: user.id, email: user.email });
      const newRefresh = createRefreshTokenValue();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + env.JWT_REFRESH_EXPIRES_DAYS);

      await tx.refreshToken.create({
        data: {
          userId: user.id,
          familyId: stored.familyId,
          tokenHash: hashToken(newRefresh),
          expiresAt,
        },
      });

      return {
        user: { id: user.id, email: user.email, name: user.name },
        accessToken,
        refreshToken: newRefresh,
      };
    });

    res.json(result);
  })
);

router.post(
  "/forgot-password",
  asyncHandler(async (req, res) => {
    const started = Date.now();
    const { email } = forgotPasswordSchema.parse(req.body);
    const normalized = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalized },
    });

    if (user) {
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
        // Never log the reset token/URL here.
        console.error(
          "[Journal IQ] forgot-password email failed:",
          err instanceof Error ? err.message : "unknown"
        );
      }

      // Pad response time to reduce timing enumeration.
      const elapsed = Date.now() - started;
      if (elapsed < 400) await sleep(400 - elapsed);

      if (env.NODE_ENV === "development") {
        const LOCAL_OTP = "123456";
        console.log(
          `[Journal IQ] Local reset OTP for ${user.email}: ${LOCAL_OTP} (dev only)`
        );
        res.json({
          ok: true,
          localReset: { otp: LOCAL_OTP, token },
        });
        return;
      }

      res.json({ ok: true });
      return;
    }

    const elapsed = Date.now() - started;
    if (elapsed < 400) await sleep(400 - elapsed);
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
      include: { user: { select: { email: true } } },
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
      prisma.passwordReset.updateMany({
        where: { userId: reset.userId, usedAt: null, id: { not: reset.id } },
        data: { usedAt: new Date() },
      }),
      prisma.refreshToken.updateMany({
        where: { userId: reset.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    void sendPasswordChangedEmail(reset.user.email);

    res.json({ ok: true });
  })
);

export default router;
