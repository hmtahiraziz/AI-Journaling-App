import { useMemo } from "react";
import { Text, View, ActivityIndicator, useWindowDimensions, Pressable } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Screen } from "@/src/components/Screen";
import { GlassCard } from "@/src/components/GlassCard";
import { AppHeader } from "@/src/components/AppHeader";
import { WeeklyMoodInsight } from "@/src/components/WeeklyMoodInsight";
import { getWeeklyInsight, listMoods } from "@/src/api/journals.api";
import { buildThisWeekMoodProgress } from "@/src/constants/moods";
import { colors } from "@/src/theme/colors";
import { MEDICAL_DISCLAIMER } from "@/src/constants/disclaimer";
import { tabBarClearance } from "@/src/constants/tabBar";

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

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width < 360;

  const insight = useQuery({ queryKey: ["weekly-insight"], queryFn: getWeeklyInsight });
  const moods = useQuery({ queryKey: ["moods"], queryFn: listMoods });

  const week = useMemo(
    () => buildThisWeekMoodProgress(moods.data ?? []),
    [moods.data]
  );

  const loading = insight.isLoading || moods.isLoading;

  return (
    <Screen>
      <View style={{ paddingBottom: tabBarClearance(insets.bottom) }}>
        <AppHeader showBrand={false} title="AI Insights" />
        <Text className="font-sans mb-5 -mt-2" style={{ color: colors.muted }}>
          {MEDICAL_DISCLAIMER}
        </Text>

        {loading ? (
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
              <WeeklyMoodInsight
                summary={insight.data.summary}
                week={week}
                compact={compact}
              />
            ) : null}

            {insight.data?.summary?.themes.length ? (
              <GlassCard className="mb-3">
                <SectionLabel>Themes this week</SectionLabel>
                <ChipRow
                  items={insight.data.summary.themes.map((t) => ({
                    label: t.label,
                    count: t.count,
                  }))}
                />
              </GlassCard>
            ) : null}

            {insight.data?.summary?.topMoods.length ? (
              <GlassCard className="mb-5">
                <SectionLabel>Moods you named</SectionLabel>
                <ChipRow items={insight.data.summary.topMoods} />
              </GlassCard>
            ) : null}

            <GlassCard>
              <SectionLabel>This week</SectionLabel>
              <Text
                className={
                  compact
                    ? "font-displayItalic text-lg leading-7"
                    : "font-displayItalic text-xl leading-8"
                }
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
