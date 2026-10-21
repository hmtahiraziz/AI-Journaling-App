import { Router } from "express";
import { passwordConfirmSchema, updateProfileSchema } from "@journal-iq/shared";
import { prisma } from "../lib/prisma";
import { AppError, asyncHandler } from "../middleware/error";
import type { AuthRequest } from "../middleware/auth";
import { authenticate } from "../middleware/auth";
import { verifyPassword } from "../lib/tokens";
import rateLimit from "express-rate-limit";

const router = Router();

router.use(authenticate);

const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const userId = (req as AuthRequest).user?.userId;
    return userId || req.ip || "anonymous";
  },
  message: { error: "Too many sensitive account requests. Please wait and try again." },
  validate: false,
});

async function requirePassword(req: AuthRequest) {
  const { password } = passwordConfirmSchema.parse(req.body);
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.user!.userId },
    select: { id: true, passwordHash: true },
  });
  if (!(await verifyPassword(password, user.passwordHash))) {
    throw new AppError(401, "Incorrect password");
  }
  return user;
}

router.get(
  "/",
  asyncHandler(async (req: AuthRequest, res) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        name: true,
        timezone: true,
        createdAt: true,
        consentLegalVersion: true,
        consentLegalAt: true,
      },
    });
    res.json({ user });
  })
);

router.patch(
  "/",
  asyncHandler(async (req: AuthRequest, res) => {
    const data = updateProfileSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        name: data.name,
        timezone: data.timezone,
      },
      select: {
        id: true,
        email: true,
        name: true,
        timezone: true,
        createdAt: true,
        consentLegalVersion: true,
        consentLegalAt: true,
      },
    });
    res.json({ user });
  })
);

/** Full account data export — requires password confirmation (POST). */
router.post(
  "/export",
  sensitiveLimiter,
  asyncHandler(async (req: AuthRequest, res) => {
    await requirePassword(req);
    const userId = req.user!.userId;

    const [user, journals, moods, insights] = await Promise.all([
      prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          timezone: true,
          createdAt: true,
          consentLegalVersion: true,
          consentLegalAt: true,
        },
      }),
      prisma.journalEntry.findMany({
        where: { userId },
        include: { prompt: { select: { text: true, category: true } }, mood: true },
        orderBy: { createdAt: "asc" },
        take: 5000,
      }),
      prisma.moodEntry.findMany({
        where: { userId },
        orderBy: { loggedAt: "asc" },
        take: 5000,
      }),
      prisma.aiInsight.findMany({
        where: { userId },
        orderBy: { periodStart: "asc" },
        take: 500,
        select: {
          id: true,
          periodStart: true,
          periodEnd: true,
          content: true,
          createdAt: true,
        },
      }),
    ]);

    console.log(`[Journal IQ] Account export for user ${userId}`);

    res.setHeader("Cache-Control", "no-store");
    res.json({
      exportedAt: new Date().toISOString(),
      app: "Journal IQ",
      user,
      journals,
      moods,
      insights,
    });
  })
);

/** Permanently delete the account — requires password confirmation. */
router.delete(
  "/",
  sensitiveLimiter,
  asyncHandler(async (req: AuthRequest, res) => {
    await requirePassword(req);
    const userId = req.user!.userId;
    try {
      await prisma.user.delete({ where: { id: userId } });
      console.log(`[Journal IQ] Account deleted for user ${userId}`);
    } catch (err: unknown) {
      const code = err && typeof err === "object" && "code" in err ? (err as { code: string }).code : "";
      // Idempotent if already deleted
      if (code !== "P2025") throw err;
    }
    res.json({ ok: true });
  })
);

export default router;
