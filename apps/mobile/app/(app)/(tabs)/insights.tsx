import { Text, View, ActivityIndicator, useWindowDimensions, Pressable } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Screen } from "@/src/components/Screen";
import { GlassCard } from "@/src/components/GlassCard";
import { AppHeader } from "@/src/components/AppHeader";
import { getWeeklyInsight, type WeeklyInsightSummary } from "@/src/api/journals.api";
import { colors } from "@/src/theme/colors";
import { MEDICAL_DISCLAIMER } from "@/src/constants/disclaimer";
import { tabBarClearance } from "@/src/constants/tabBar";

function StatTile({
  label,
  value,
  compact,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <View
      className="flex-1 rounded-2xl px-3 py-3"
      style={{
        backgroundColor: colors.glassStrong,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        minHeight: compact ? 68 : 76,
        justifyContent: "center",
      }}
    >
      <Text
        className="font-sansMedium text-[10px] tracking-widest uppercase mb-1"
        style={{ color: colors.muted }}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Text
        className={compact ? "font-display text-xl" : "font-display text-2xl"}
        style={{ color: colors.ink }}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

function ChipRow({ items }: { items: { label: string; count: number }[] }) {
  if (!items.length) return null;
  return (
    <View className="flex-row flex-wrap" style={{ gap: 8 }}>
      {items.map((item) => (
        <View
          key={item.label}
          className="rounded-full px-3 py-1.5"
          style={{
            backgroundColor: "rgba(0,207,238,0.12)",
            borderWidth: 1,
            borderColor: "rgba(0,207,238,0.28)",
          }}
        >
          <Text className="font-sansMedium text-xs" style={{ color: colors.secondary }}>
            {item.label}
            {item.count > 1 ? ` · ${item.count}` : ""}
          </Text>
        </View>
      ))}
    </View>
  );
}

function SummaryBlock({ summary, compact }: { summary: WeeklyInsightSummary; compact: boolean }) {
  const moodValue =
    summary.moodAverage != null ? `${summary.moodAverage.toFixed(1)}` : "—";
  const journalValue = `${summary.journalDays}/${7}`;

  return (
    <View className="mb-5">
      <View className="flex-row mb-3" style={{ gap: compact ? 8 : 10 }}>
        <StatTile label="Avg mood" value={moodValue} compact={compact} />
        <StatTile label="Check-ins" value={String(summary.moodCount)} compact={compact} />
        <StatTile label="Wrote" value={journalValue} compact={compact} />
      </View>

      {summary.themes.length > 0 ? (
        <GlassCard className="mb-3">
          <Text
            className="font-sansMedium text-xs tracking-widest uppercase mb-3"
            style={{ color: colors.secondary }}
          >
            Themes this week
          </Text>
          <ChipRow items={summary.themes.map((t) => ({ label: t.label, count: t.count }))} />
        </GlassCard>
      ) : null}

      {summary.topMoods.length > 0 ? (
        <GlassCard>
          <Text
            className="font-sansMedium text-xs tracking-widest uppercase mb-3"
            style={{ color: colors.secondary }}
          >
            Moods you named
          </Text>
          <ChipRow items={summary.topMoods} />
        </GlassCard>
      ) : null}
    </View>
  );
}

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width < 360;
  const insight = useQuery({ queryKey: ["weekly-insight"], queryFn: getWeeklyInsight });

  return (
    <Screen>
      <View style={{ paddingBottom: tabBarClearance(insets.bottom) }}>
        <AppHeader showBrand={false} title="AI Insights" />
        <Text className="font-sans mb-5 -mt-2" style={{ color: colors.muted }}>
          {MEDICAL_DISCLAIMER}
        </Text>

        {insight.isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : insight.isError ? (
          <GlassCard>
            <Text className="font-sansMedium mb-2" style={{ color: colors.ink }}>
              Couldn’t load insights
            </Text>
            <Text className="font-sans" style={{ color: colors.muted }}>
              Try again after a check-in or journal entry.
            </Text>
            <Pressable onPress={() => insight.refetch()} className="mt-4 min-h-[44px] justify-center">
              <Text className="font-sansMedium" style={{ color: colors.secondary }}>
                Tap to retry
              </Text>
            </Pressable>
          </GlassCard>
        ) : (
          <>
            {insight.data?.summary ? (
              <SummaryBlock summary={insight.data.summary} compact={compact} />
            ) : null}

            <GlassCard>
              <Text
                className="font-sansMedium text-xs tracking-widest uppercase mb-3"
                style={{ color: colors.secondary }}
              >
                This week
              </Text>
              <Text
                className={compact ? "font-displayItalic text-lg leading-7" : "font-displayItalic text-xl leading-8"}
                style={{ color: colors.ink }}
              >
                {insight.data?.insight.content}
              </Text>
            </GlassCard>
          </>
        )}
      </View>
    </Screen>
  );
}
