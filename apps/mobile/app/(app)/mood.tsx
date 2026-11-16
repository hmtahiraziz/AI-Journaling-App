import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Screen } from "@/src/components/Screen";
import { MoodPicker } from "@/src/components/MoodPicker";
import { MoodCarousel } from "@/src/components/MoodCarousel";
import { Field } from "@/src/components/Field";
import { Button } from "@/src/components/Button";
import { GlassCard } from "@/src/components/GlassCard";
import { createMood } from "@/src/api/journals.api";
import { getErrorMessage } from "@/src/api/client";
import { toast } from "@/src/lib/toast";
import { colors } from "@/src/theme/colors";

export default function MoodScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const [score, setScore] = useState<number | null>(null);
  const [label, setLabel] = useState("");
  const [note, setNote] = useState("");

  const save = useMutation({
    mutationFn: () => createMood({ score: score!, label, note: note || undefined }),
    onSuccess: () => {
      setNote("");
      setScore(null);
      qc.invalidateQueries({ queryKey: ["mood-stats"] });
      qc.invalidateQueries({ queryKey: ["moods"] });
      qc.invalidateQueries({ queryKey: ["weekly-insight"] });
      toast.success("Mood check-in saved");
    },
    onError: (e) => toast.error(getErrorMessage(e, "Couldn’t save mood")),
  });

  return (
    <Screen scroll edges={["top", "left", "right", "bottom"]}>
      <Pressable onPress={() => router.back()} className="mb-4 min-h-[44px] justify-center">
        <Text className="font-sansMedium" style={{ color: colors.secondary }}>
          ← Back
        </Text>
      </Pressable>

      <Text className="font-display text-3xl mb-1" style={{ color: colors.ink }}>
        Log mood
      </Text>
      <Text className="font-sans mb-5" style={{ color: colors.muted }}>
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

      <Text className="font-sans text-sm text-center" style={{ color: colors.muted }}>
        Weekly mood trends live in AI Insights.
      </Text>
    </Screen>
  );
}
