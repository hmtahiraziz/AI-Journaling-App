/** Soft “showed up” streak from journal entry timestamps (local calendar days). */

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function startOfLocalDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export type StreakInfo = {
  /** Consecutive days ending today or yesterday with at least one entry. */
  current: number;
  /** Unique days with an entry in the last 7 local days (including today). */
  daysThisWeek: number;
  wroteToday: boolean;
};

export function computeStreak(createdAts: string[]): StreakInfo {
  const today = startOfLocalDay(new Date());
  const keys = new Set(createdAts.map((iso) => dayKey(new Date(iso))));

  const wroteToday = keys.has(dayKey(today));

  let daysThisWeek = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (keys.has(dayKey(d))) daysThisWeek += 1;
  }

  let current = 0;
  let cursor = new Date(today);
  if (!wroteToday) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (keys.has(dayKey(cursor))) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { current, daysThisWeek, wroteToday };
}

export function streakLabel(info: StreakInfo): string {
  if (info.current <= 0) {
    return info.daysThisWeek > 0
      ? `${info.daysThisWeek} of 7 days this week`
      : "A quiet week so far";
  }
  if (info.current === 1) {
    return info.wroteToday ? "You showed up today" : "You showed up yesterday";
  }
  return `${info.current}-day streak`;
}
