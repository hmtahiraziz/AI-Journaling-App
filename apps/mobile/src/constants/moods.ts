export const MOODS = [
  { score: 1, label: "Low", emoji: "😔" },
  { score: 2, label: "Uneasy", emoji: "😕" },
  { score: 3, label: "Okay", emoji: "😐" },
  { score: 4, label: "Good", emoji: "🙂" },
  { score: 5, label: "Great!", emoji: "😄" },
] as const;

export type MoodOption = (typeof MOODS)[number];

export function moodByScore(score: number) {
  const rounded = Math.min(5, Math.max(1, Math.round(score)));
  return MOODS.find((m) => m.score === rounded) ?? MOODS[2];
}

export function moodLabel(score: number) {
  return moodByScore(score).label.replace("!", "");
}

/** Accent for charts — cooler below mid, primary above. */
export function moodAccent(score: number | null, cool: string, warm: string, empty: string) {
  if (score == null) return empty;
  return (score - 1) / 4 < 0.5 ? cool : warm;
}

/** Local calendar key YYYY-MM-DD (avoids UTC day-shift). */
export function localDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export type WeekDayMood = {
  date: string;
  weekday: string;
  average: number | null;
  count: number;
};

export type WeekMoodProgress = {
  average: number | null;
  count: number;
  label: string;
  emoji: string;
  days: WeekDayMood[];
};

/** Days in the week series that have at least one check-in. */
export function moodActiveDays(week: WeekMoodProgress) {
  return week.days.filter((d) => d.count > 0).length;
}

type MoodLike = { score: number; loggedAt: string };

/** Last 7 local days + average label from real check-ins. */
export function buildThisWeekMoodProgress(moods: MoodLike[]): WeekMoodProgress {
  const dayKeys: string[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - i);
    dayKeys.push(localDateKey(d));
  }

  const keySet = new Set(dayKeys);
  const byDay: Record<string, number[]> = {};
  for (const key of dayKeys) byDay[key] = [];

  let weekScores: number[] = [];
  for (const mood of moods) {
    const key = localDateKey(new Date(mood.loggedAt));
    if (!keySet.has(key)) continue;
    byDay[key].push(mood.score);
    weekScores.push(mood.score);
  }

  const days: WeekDayMood[] = dayKeys.map((date) => {
    const scores = byDay[date];
    const average =
      scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
    const d = new Date(`${date}T12:00:00`);
    return {
      date,
      weekday: d.toLocaleDateString(undefined, { weekday: "short" }),
      average,
      count: scores.length,
    };
  });

  const average =
    weekScores.length > 0
      ? weekScores.reduce((a, b) => a + b, 0) / weekScores.length
      : null;
  const mood = average != null ? moodByScore(average) : null;

  return {
    average,
    count: weekScores.length,
    label: mood ? mood.label.replace("!", "") : "—",
    emoji: mood?.emoji ?? "—",
    days,
  };
}
