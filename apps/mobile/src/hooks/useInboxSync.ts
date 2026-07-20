import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { listJournals, getWeeklyInsight } from "@/src/api/journals.api";
import { useNotificationsStore } from "@/src/store/notifications";
import { computeStreak } from "@/src/utils/streaks";

/**
 * Keeps the local inbox in sync with journals + weekly insight.
 * Mount once on Home (or any authenticated shell screen).
 */
export function useInboxSync(enabled: boolean) {
  const syncFromAppState = useNotificationsStore((s) => s.syncFromAppState);
  const hydrated = useNotificationsStore((s) => s.hydrated);
  const lastKey = useRef<string>("");

  const journals = useQuery({
    queryKey: ["journals"],
    queryFn: listJournals,
    enabled,
  });

  const insight = useQuery({
    queryKey: ["weekly-insight"],
    queryFn: getWeeklyInsight,
    enabled,
    retry: false,
  });

  useEffect(() => {
    if (!enabled || !hydrated) return;

    const entries = journals.data ?? [];
    const streak = computeStreak(entries.map((e) => e.createdAt));
    const weekly = insight.data?.insight
      ? {
          periodStart: insight.data.insight.periodStart,
          preview: insight.data.insight.content,
        }
      : null;

    const key = [
      entries.length,
      streak.wroteToday ? "1" : "0",
      streak.current,
      weekly?.periodStart ?? "",
      weekly?.preview?.slice(0, 40) ?? "",
    ].join("|");

    if (key === lastKey.current) return;
    lastKey.current = key;

    void syncFromAppState({
      entryCount: entries.length,
      wroteToday: streak.wroteToday,
      streakCount: streak.current,
      weeklyInsight: weekly,
    });
  }, [
    enabled,
    hydrated,
    journals.data,
    insight.data,
    syncFromAppState,
  ]);
}
