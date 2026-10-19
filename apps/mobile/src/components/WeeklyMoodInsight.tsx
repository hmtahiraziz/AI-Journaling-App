import { Text, View } from "react-native";
import { GlassCard } from "@/src/components/GlassCard";
import {
  moodAccent,
  moodActiveDays,
  moodByScore,
  type WeekMoodProgress,
} from "@/src/constants/moods";
import type { WeeklyInsightSummary } from "@/src/api/journals.api";
import { colors } from "@/src/theme/colors";

const WEEK_TARGET = 7;
const CHART_MAX = 88;

type ProgressRowProps = {
  label: string;
  valueLabel: string;
  progress: number;
  tint: string;
};

function ProgressRow({ label, valueLabel, progress, tint }: ProgressRowProps) {
  const clamped = Math.min(1, Math.max(0, progress));
  return (
    <View className="mb-3">
      <View className="flex-row items-center justify-between mb-1.5">
        <Text className="font-sansMedium text-sm" style={{ color: colors.ink }}>
          {label}
        </Text>
        <Text className="font-sans text-xs" style={{ color: colors.muted }}>
          {valueLabel}
        </Text>
      </View>
      <View
        style={{
          height: 8,
          borderRadius: 999,
          backgroundColor: colors.glassStrong,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: colors.glassBorder,
        }}
      >
        <View
          style={{
            width: `${Math.round(clamped * 100)}%`,
            height: "100%",
            borderRadius: 999,
            backgroundColor: tint,
          }}
        />
      </View>
    </View>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text
      className="font-sansMedium text-xs tracking-widest uppercase mb-3"
      style={{ color: colors.secondary }}
    >
      {children}
    </Text>
  );
}

type Props = {
  summary: WeeklyInsightSummary;
  week: WeekMoodProgress;
  compact?: boolean;
};

/**
 * Weekly mood detection, progress bars, and 7-day chart for AI Insights.
 */
export function WeeklyMoodInsight({ summary, week, compact }: Props) {
  const detected =
    week.average != null
      ? moodByScore(week.average)
      : summary.moodAverage != null
        ? moodByScore(summary.moodAverage)
        : null;

  const scoreValue = week.average ?? summary.moodAverage;
  const checkInDays = moodActiveDays(week);
  const journalProgress = summary.journalDays / WEEK_TARGET;
  const moodDayProgress = checkInDays / WEEK_TARGET;

  return (
    <View className="mb-5">
      <GlassCard className="mb-3">
        <SectionLabel>Mood detection</SectionLabel>
        {detected && scoreValue != null ? (
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center" style={{ gap: 12, flex: 1 }}>
              <Text style={{ fontSize: compact ? 34 : 40, lineHeight: compact ? 40 : 46 }}>
                {detected.emoji}
              </Text>
              <View style={{ flexShrink: 1 }}>
                <Text
                  className={compact ? "font-display text-2xl" : "font-display text-3xl"}
                  style={{ color: colors.primary }}
                  numberOfLines={1}
                >
                  {detected.label.replace("!", "")}
                </Text>
                <Text className="font-sans text-sm mt-0.5" style={{ color: colors.muted }}>
                  Average this week · {scoreValue.toFixed(1)} / 5
                </Text>
              </View>
            </View>
            <Text className="font-sans text-xs text-right" style={{ color: colors.muted }}>
              {week.count || summary.moodCount} check-in
              {(week.count || summary.moodCount) === 1 ? "" : "s"}
            </Text>
          </View>
        ) : (
          <Text className="font-sans" style={{ color: colors.muted }}>
            Log moods this week to detect your average feeling.
          </Text>
        )}
      </GlassCard>

      <GlassCard className="mb-3">
        <SectionLabel>Weekly progress</SectionLabel>
        <ProgressRow
          label="Journaling days"
          valueLabel={`${summary.journalDays} / ${WEEK_TARGET}`}
          progress={journalProgress}
          tint={colors.primary}
        />
        <ProgressRow
          label="Mood check-in days"
          valueLabel={`${checkInDays} / ${WEEK_TARGET}`}
          progress={moodDayProgress}
          tint={colors.secondary}
        />
        <View className="mt-1">
          <ProgressRow
            label="Presence"
            valueLabel={`${Math.round(((journalProgress + moodDayProgress) / 2) * 100)}%`}
            progress={(journalProgress + moodDayProgress) / 2}
            tint={colors.mint}
          />
        </View>
      </GlassCard>

      <GlassCard>
        <SectionLabel>7-day mood</SectionLabel>
        <View className="flex-row items-end gap-1.5" style={{ height: CHART_MAX + 22 }}>
          {week.days.map((day) => {
            const hasData = day.average != null;
            const height = hasData
              ? Math.max(10, ((day.average as number) / 5) * CHART_MAX)
              : 6;
            return (
              <View key={day.date} className="flex-1 items-center justify-end">
                <View
                  className="w-full rounded-t-xl"
                  style={{
                    height,
                    backgroundColor: moodAccent(
                      day.average,
                      colors.secondary,
                      colors.primary,
                      colors.glassStrong
                    ),
                    opacity: hasData ? 0.92 : 0.35,
                  }}
                />
                <Text
                  className="text-[10px] mt-1.5 font-sansMedium"
                  style={{ color: colors.muted }}
                  numberOfLines={1}
                >
                  {day.weekday}
                </Text>
              </View>
            );
          })}
        </View>
        {week.count === 0 ? (
          <Text className="font-sans text-center text-sm mt-3" style={{ color: colors.muted }}>
            Check in a few times to fill this chart.
          </Text>
        ) : null}
      </GlassCard>
    </View>
  );
}
