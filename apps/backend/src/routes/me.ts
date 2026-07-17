import { Router } from "express";
import { updateProfileSchema } from "@journal-iq/shared";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../middleware/error";
import type { AuthRequest } from "../middleware/auth";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  asyncHandler(async (req: AuthRequest, res) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: req.user!.userId },
      select: { id: true, email: true, name: true, timezone: true, createdAt: true },
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
      select: { id: true, email: true, name: true, timezone: true, createdAt: true },
    });
    res.json({ user });
  })
);

/** Full account data export for portability (JSON). */
router.get(
  "/export",
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.userId;

    const [user, journals, moods, insights] = await Promise.all([
      prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { id: true, email: true, name: true, timezone: true, createdAt: true },
      }),
      prisma.journalEntry.findMany({
        where: { userId },
        include: { prompt: { select: { text: true, category: true } }, mood: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.moodEntry.findMany({
        where: { userId },
        orderBy: { loggedAt: "asc" },
      }),
      prisma.aiInsight.findMany({
        where: { userId },
        orderBy: { periodStart: "asc" },
        select: {
          id: true,
          periodStart: true,
          periodEnd: true,
          content: true,
          createdAt: true,
        },
      }),
    ]);

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

/** Permanently delete the account and all related data (cascade). */
router.delete(
  "/",
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    await prisma.user.delete({ where: { id: userId } });
    res.json({ ok: true });
  })
);

export default router;
