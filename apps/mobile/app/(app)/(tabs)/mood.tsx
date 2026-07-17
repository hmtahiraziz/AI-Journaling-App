import { useState } from "react";
import { Text, View, Alert, ActivityIndicator } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Screen } from "@/src/components/Screen";
import { MoodPicker } from "@/src/components/MoodPicker";
import { MoodCarousel } from "@/src/components/MoodCarousel";
import { Field } from "@/src/components/Field";
import { Button } from "@/src/components/Button";
import { GlassCard } from "@/src/components/GlassCard";
import { AppHeader } from "@/src/components/AppHeader";
import { createMood, getMoodStats } from "@/src/api/journals.api";
import { getErrorMessage } from "@/src/api/client";
import { colors } from "@/src/theme/colors";
import { tabBarClearance } from "@/src/constants/tabBar";

export default function MoodScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [score, setScore] = useState<number | null>(null);
  const [label, setLabel] = useState("");
  const [note, setNote] = useState("");

  const stats = useQuery({ queryKey: ["mood-stats"], queryFn: getMoodStats });

  const save = useMutation({
    mutationFn: () => createMood({ score: score!, label, note: note || undefined }),
    onSuccess: () => {
      setNote("");
      setScore(null);
      qc.invalidateQueries({ queryKey: ["mood-stats"] });
      qc.invalidateQueries({ queryKey: ["moods"] });
      Alert.alert("Logged", "Your mood check-in is saved privately.");
    },
    onError: (e) => Alert.alert("Couldn’t save", getErrorMessage(e)),
  });

  return (
    <Screen>
      <View style={{ paddingBottom: tabBarClearance(insets.bottom) }}>
        <AppHeader showBrand={false} title="Mood" />
        <Text className="font-sans mb-5 -mt-2" style={{ color: colors.muted }}>
          A quiet check-in — no judgment, just noticing.
        </Text>

        <MoodCarousel title="How are you feeling now?" />

        <GlassCard className="mb-5">
          <Text className="font-sansMedium mb-1" style={{ color: colors.ink }}>
            Or pick with a note
          </Text>
          <Text className="font-sans text-sm mb-4" style={{ color: colors.muted }}>
            Add an optional note if something stands out.
          </Text>
          <MoodPicker
            value={score}
            onChange={(s, l) => {
              setScore(s);
              setLabel(l);
            }}
          />
          <View className="h-4" />
          <Field
            label="Optional note"
            value={note}
            onChangeText={setNote}
            placeholder="Anything you want to remember…"
            multiline
          />
          <Button
            title="Save check-in"
            onPress={() => save.mutate()}
            loading={save.isPending}
            disabled={!score}
          />
        </GlassCard>

        <Text className="font-sansBold text-lg mb-3" style={{ color: colors.ink }}>
          This week
        </Text>
        {stats.isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <GlassCard>
            <View className="flex-row items-end justify-between mb-4">
              <View>
                <Text className="font-sans text-sm" style={{ color: colors.muted }}>
                  Average mood
                </Text>
                <Text className="font-display text-4xl mt-1" style={{ color: colors.primary }}>
                  {stats.data?.average != null ? stats.data.average.toFixed(1) : "—"}
                </Text>
              </View>
              <Text className="font-sans text-sm" style={{ color: colors.muted }}>
                {stats.data?.count || 0} check-ins
              </Text>
            </View>

            <View className="flex-row items-end gap-2 h-28">
              {(stats.data?.daily || []).map((d) => (
                <View key={d.date} className="flex-1 items-center justify-end">
                  <View
                    className="w-full rounded-t-xl"
                    style={{
                      height: Math.max(8, (d.average / 5) * 96),
                      backgroundColor: colors.secondary,
                      opacity: 0.85,
                    }}
                  />
                  <Text className="text-[9px] mt-1" style={{ color: colors.muted }}>
                    {d.date.slice(5)}
                  </Text>
                </View>
              ))}
              {!stats.data?.daily?.length ? (
                <Text className="font-sans flex-1 text-center" style={{ color: colors.muted }}>
                  Log a few moods to see your week.
                </Text>
              ) : null}
            </View>
          </GlassCard>
        )}
      </View>
    </Screen>
  );
}
