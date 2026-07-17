import { useMemo } from "react";
import { Text, View, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Screen } from "@/src/components/Screen";
import { GlassCard } from "@/src/components/GlassCard";
import { AppHeader } from "@/src/components/AppHeader";
import { WriteWidgetGrid } from "@/src/components/WriteWidgetGrid";
import { MoodCarousel } from "@/src/components/MoodCarousel";
import { StreakStrip } from "@/src/components/StreakStrip";
import { listJournals, getTodayPrompt } from "@/src/api/journals.api";
import { useAuthStore } from "@/src/store/auth";
import { firstName } from "@/src/utils/displayName";
import { computeStreak } from "@/src/utils/streaks";
import { colors } from "@/src/theme/colors";
import { type } from "@/src/theme/typography";
import { tabBarClearance } from "@/src/constants/tabBar";

function greetingSubline(hasEntries: boolean, wroteToday: boolean) {
  if (wroteToday) return "You showed up today. That matters.";
  if (!hasEntries) return "Your first reflection takes about two minutes.";
  return "Keep your momentum going. You're doing great!";
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const name = firstName(user?.name);

  const promptQuery = useQuery({ queryKey: ["prompt-today"], queryFn: getTodayPrompt });
  const journalsQuery = useQuery({ queryKey: ["journals"], queryFn: listJournals });

  const entries = journalsQuery.data || [];
  const recent = entries.slice(0, 2);
  const streak = useMemo(
    () => computeStreak(entries.map((e) => e.createdAt)),
    [entries]
  );

  return (
    <Screen>
      <View style={{ paddingBottom: tabBarClearance(insets.bottom) }}>
        <AppHeader />

        <Text
          className="font-display mb-1.5"
          style={{
            color: colors.ink,
            fontSize: type.greeting.fontSize,
            lineHeight: type.greeting.lineHeight,
          }}
        >
          Hey {name}!
        </Text>
        <Text
          className="font-sans mb-5"
          style={{
            color: colors.muted,
            fontSize: type.body.fontSize,
            lineHeight: type.body.lineHeight,
          }}
        >
          {greetingSubline(entries.length > 0, streak.wroteToday)}
        </Text>

        {entries.length > 0 ? <StreakStrip info={streak} /> : null}

        <WriteWidgetGrid />

        <MoodCarousel />

        {promptQuery.data?.prompt?.text ? (
          <GlassCard className="mb-5">
            <Text
              className="font-sansMedium mb-2"
              style={{ color: colors.secondary, ...type.label }}
            >
              Today’s prompt
            </Text>
            <Text
              className="font-displayItalic"
              style={{
                color: colors.ink,
                fontSize: type.body.fontSize,
                lineHeight: type.body.lineHeight + 2,
              }}
            >
              {promptQuery.data.prompt.text}
            </Text>
          </GlassCard>
        ) : promptQuery.isLoading ? (
          <View className="mb-5 items-center py-4">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : null}

        <View className="flex-row items-center justify-between mb-3 px-1">
          <Text
            className="font-sansBold"
            style={{
              color: colors.ink,
              fontSize: type.title.fontSize,
              lineHeight: type.title.lineHeight,
            }}
          >
            Recent
          </Text>
          <Pressable
            onPress={() => router.push("/(app)/(tabs)/journal")}
            hitSlop={10}
            className="min-h-[44px] justify-center"
          >
            <Text className="font-sansMedium" style={{ color: colors.secondary, fontSize: type.body.fontSize }}>
              See all
            </Text>
          </Pressable>
        </View>

        {journalsQuery.isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : recent.length === 0 ? (
          <GlassCard>
            <Text className="font-sansMedium mb-1" style={{ color: colors.ink, fontSize: type.body.fontSize }}>
              Your first entry is waiting
            </Text>
            <Text className="font-sans" style={{ color: colors.muted, fontSize: type.body.fontSize }}>
              Tap Prompt Journal above whenever you’re ready.
            </Text>
          </GlassCard>
        ) : (
          recent.map((entry) => (
            <Pressable
              key={entry.id}
              onPress={() => router.push(`/(app)/entry/${entry.id}`)}
              className="mb-3"
            >
              <GlassCard>
                <Text
                  className="font-sans mb-1"
                  style={{ color: colors.muted, fontSize: type.caption.fontSize }}
                >
                  {new Date(entry.createdAt).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                  {entry.mood ? ` · ${entry.mood.label}` : ""}
                  {entry.isFreeWrite ? " · Free-write" : " · Prompt"}
                </Text>
                <Text
                  className="font-sans"
                  numberOfLines={2}
                  style={{ color: colors.ink, fontSize: type.body.fontSize, lineHeight: type.body.lineHeight }}
                >
                  {entry.body}
                </Text>
              </GlassCard>
            </Pressable>
          ))
        )}
      </View>
    </Screen>
  );
}
