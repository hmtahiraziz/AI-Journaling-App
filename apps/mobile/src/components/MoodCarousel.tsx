import { useState } from "react";
import { Pressable, Text, View, Alert } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { GlassCard } from "@/src/components/GlassCard";
import { Button } from "@/src/components/Button";
import { MOODS } from "@/src/constants/moods";
import { createMood } from "@/src/api/journals.api";
import { getErrorMessage } from "@/src/api/client";
import { colors } from "@/src/theme/colors";
import { type } from "@/src/theme/typography";

/** Fixed block so emoji/label swaps never shift layout. */
const MOOD_STAGE_HEIGHT = 140;

type Props = {
  title?: string;
  showNoteHint?: boolean;
};

export function MoodCarousel({ title = "How are you feeling now?" }: Props) {
  const qc = useQueryClient();
  const [index, setIndex] = useState(4);
  const mood = MOODS[index];

  const save = useMutation({
    mutationFn: () => createMood({ score: mood.score, label: mood.label.replace("!", "") }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mood-stats"] });
      qc.invalidateQueries({ queryKey: ["moods"] });
      Alert.alert("Checked in", "Your mood is saved privately.");
    },
    onError: (e) => Alert.alert("Couldn’t save", getErrorMessage(e)),
  });

  function prev() {
    setIndex((i) => (i === 0 ? MOODS.length - 1 : i - 1));
  }
  function next() {
    setIndex((i) => (i === MOODS.length - 1 ? 0 : i + 1));
  }

  return (
    <GlassCard className="mb-5">
      <Text
        className="font-sansMedium text-center mb-4"
        style={{ color: colors.ink, fontSize: type.body.fontSize, lineHeight: type.body.lineHeight }}
      >
        {title}
      </Text>

      <View className="flex-row items-center justify-between px-1">
        <Pressable
          onPress={prev}
          hitSlop={16}
          accessibilityLabel="Previous mood"
          style={{
            width: 48,
            height: 48,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="chevron-back" size={28} color={colors.ink} />
        </Pressable>

        <View
          style={{
            flex: 1,
            height: MOOD_STAGE_HEIGHT,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: type.moodEmoji.fontSize, lineHeight: type.moodEmoji.lineHeight }}>
            {mood.emoji}
          </Text>
          <Text
            className="font-display"
            style={{
              color: colors.ink,
              fontSize: type.moodLabel.fontSize,
              lineHeight: type.moodLabel.lineHeight,
              marginTop: 2,
            }}
          >
            {mood.label}
          </Text>
        </View>

        <Pressable
          onPress={next}
          hitSlop={16}
          accessibilityLabel="Next mood"
          style={{
            width: 48,
            height: 48,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="chevron-forward" size={28} color={colors.ink} />
        </Pressable>
      </View>

      <View className="mt-4">
        <Button
          title="Check Today"
          onPress={() => save.mutate()}
          loading={save.isPending}
          variant="secondary"
        />
      </View>
    </GlassCard>
  );
}
