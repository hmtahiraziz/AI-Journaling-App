import { Router } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../middleware/error";
import type { AuthRequest } from "../middleware/auth";
import { authenticate } from "../middleware/auth";
import { weeklyInsightLimiter } from "../middleware/aiRateLimit";
import { generateWeeklyInsight } from "../services/ai";
import { extractThemes } from "../services/themes";

const router = Router();

router.use(authenticate);

function topMoodLabels(moods: { label: string }[], limit = 3) {
  const counts = new Map<string, number>();
  for (const m of moods) {
    const key = m.label.trim() || "Okay";
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function uniqueDayCount(dates: Date[]) {
  const keys = new Set(dates.map((d) => d.toISOString().slice(0, 10)));
  return keys.size;
}

router.get(
  "/weekly",
  weeklyInsightLimiter,
  asyncHandler(async (req: AuthRequest, res) => {
    const periodEnd = new Date();
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - 7);

    const [moods, entries] = await Promise.all([
      prisma.moodEntry.findMany({
        where: {
          userId: req.user!.userId,
          loggedAt: { gte: periodStart },
        },
        orderBy: { loggedAt: "asc" },
      }),
      prisma.journalEntry.findMany({
        where: {
          userId: req.user!.userId,
          createdAt: { gte: periodStart },
        },
        include: { prompt: true, mood: true },
        orderBy: { createdAt: "desc" },
        take: 14,
      }),
    ]);

    const moodAverage =
      moods.length > 0
        ? moods.reduce((sum, m) => sum + m.score, 0) / moods.length
        : null;

    const themes = extractThemes(entries.map((e) => e.body));
    const summary = {
      moodAverage: moodAverage != null ? Math.round(moodAverage * 10) / 10 : null,
      moodCount: moods.length,
      journalCount: entries.length,
      journalDays: uniqueDayCount(entries.map((e) => e.createdAt)),
      topMoods: topMoodLabels(moods),
      themes,
    };

    const cached = await prisma.aiInsight.findFirst({
      where: {
        userId: req.user!.userId,
        periodStart: { gte: new Date(periodStart.getTime() - 12 * 60 * 60 * 1000) },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: "desc" },
    });

    if (cached) {
      return res.json({ insight: cached, summary });
    }

    const content = await generateWeeklyInsight({
      moods: moods.map((m) => ({
        score: m.score,
        label: m.label,
        loggedAt: m.loggedAt.toISOString(),
      })),
      entries: entries.map((e) => ({
        snippet: e.body.slice(0, 280),
        createdAt: e.createdAt.toISOString(),
        isFreeWrite: e.isFreeWrite,
        promptText: e.prompt?.text ?? null,
        moodLabel: e.mood?.label ?? null,
      })),
      summary: {
        ...summary,
        themes: themes.map((t) => ({ label: t.label, count: t.count })),
      },
    });

    const insight = await prisma.aiInsight.create({
      data: {
        userId: req.user!.userId,
        periodStart,
        periodEnd,
        content,
      },
    });

    res.json({ insight, summary });
  })
);

export default router;
