import { Router } from "express";
import { createMoodSchema, MOOD_LABELS } from "@journal-iq/shared";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../middleware/error";
import type { AuthRequest } from "../middleware/auth";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  asyncHandler(async (req: AuthRequest, res) => {
    const moods = await prisma.moodEntry.findMany({
      where: { userId: req.user!.userId },
      orderBy: { loggedAt: "desc" },
      take: 90,
    });
    res.json({ moods });
  })
);

router.post(
  "/",
  asyncHandler(async (req: AuthRequest, res) => {
    const data = createMoodSchema.parse(req.body);
    const mood = await prisma.moodEntry.create({
      data: {
        userId: req.user!.userId,
        score: data.score,
        label: data.label || MOOD_LABELS[data.score] || "Okay",
        note: data.note ?? null,
        loggedAt: data.loggedAt ? new Date(data.loggedAt) : new Date(),
      },
    });
    res.status(201).json({ mood });
  })
);

router.get(
  "/stats",
  asyncHandler(async (req: AuthRequest, res) => {
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const moods = await prisma.moodEntry.findMany({
      where: {
        userId: req.user!.userId,
        loggedAt: { gte: since },
      },
      orderBy: { loggedAt: "asc" },
    });

    const average =
      moods.length > 0
        ? moods.reduce((sum, m) => sum + m.score, 0) / moods.length
        : null;

    const byDay: Record<string, number[]> = {};
    for (const mood of moods) {
      const key = mood.loggedAt.toISOString().slice(0, 10);
      byDay[key] = byDay[key] || [];
      byDay[key].push(mood.score);
    }

    const daily = Object.entries(byDay).map(([date, scores]) => ({
      date,
      average: scores.reduce((a, b) => a + b, 0) / scores.length,
      count: scores.length,
    }));

    res.json({
      average,
      count: moods.length,
      daily,
      moods,
    });
  })
);

export default router;
