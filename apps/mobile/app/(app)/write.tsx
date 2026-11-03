import { useMemo, useState } from "react";
import { Text, View, Switch, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Screen } from "@/src/components/Screen";
import { Field } from "@/src/components/Field";
import { Button } from "@/src/components/Button";
import { MoodPicker } from "@/src/components/MoodPicker";
import { GlassCard } from "@/src/components/GlassCard";
import { createJournal, createMood, getTodayPrompt, reflectOnJournal } from "@/src/api/journals.api";
import { getErrorMessage } from "@/src/api/client";
import { toast } from "@/src/lib/toast";
import { colors } from "@/src/theme/colors";
import { MEDICAL_DISCLAIMER } from "@/src/constants/disclaimer";
import { AI_DISCLOSURE_SHORT } from "@/src/constants/support";

export default function WriteScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const [isFreeWrite, setIsFreeWrite] = useState(mode === "free");
  const [body, setBody] = useState("");
  const [moodScore, setMoodScore] = useState<number | null>(null);
  const [moodLabel, setMoodLabel] = useState("");
  /** Opt-in: journal text is only sent to OpenAI when this is true. */
  const [wantAiReflection, setWantAiReflection] = useState(false);

  const promptQuery = useQuery({ queryKey: ["prompt-today"], queryFn: getTodayPrompt });

  const save = useMutation({
    mutationFn: async () => {
      let moodId: string | undefined;
      if (moodScore) {
        const mood = await createMood({ score: moodScore, label: moodLabel });
        moodId = mood.id;
      }
      const entry = await createJournal({
        body: body.trim(),
        isFreeWrite,
        promptId: isFreeWrite ? null : promptQuery.data?.prompt.id,
        moodId,
      });
      if (wantAiReflection) {
        return reflectOnJournal(entry.id);
      }
      return entry;
    },
    onSuccess: (entry) => {
      qc.invalidateQueries({ queryKey: ["journals"] });
      qc.invalidateQueries({ queryKey: ["mood-stats"] });
      if (wantAiReflection) {
        qc.invalidateQueries({ queryKey: ["weekly-insight"] });
      }
      toast.success(entry.reflection ? "Saved with AI reflection" : "Entry saved");
      router.replace(`/(app)/entry/${entry.id}`);
    },
    onError: (e) => toast.error(getErrorMessage(e, "Couldn’t save entry")),
  });

  const helper = useMemo(() => {
    if (isFreeWrite) return "Write whatever is present — no structure needed.";
    return promptQuery.data?.prompt.text || "Loading today’s prompt…";
  }, [isFreeWrite, promptQuery.data]);

  return (
    <Screen>
      <Pressable onPress={() => router.back()} className="mb-4 min-h-[44px] justify-center">
        <Text className="font-sansMedium" style={{ color: colors.secondary }}>
          ← Back
        </Text>
      </Pressable>

      <Text className="font-display text-3xl mb-1" style={{ color: colors.ink }}>
        Write
      </Text>
      <Text className="font-sans text-sm mb-4" style={{ color: colors.muted, lineHeight: 20 }}>
        {MEDICAL_DISCLAIMER}
      </Text>
      <View className="flex-row items-center justify-between mb-4">
        <Text className="font-sans" style={{ color: colors.muted }}>
          Free-write
        </Text>
        <Switch
          value={isFreeWrite}
          onValueChange={setIsFreeWrite}
          trackColor={{ true: colors.primary, false: "rgba(254,254,254,0.2)" }}
          thumbColor={colors.ink}
          accessibilityLabel="Free-write mode"
        />
      </View>

      <GlassCard className="mb-5">
        <Text
          className="font-sansMedium text-xs uppercase tracking-widest mb-2"
          style={{ color: colors.secondary }}
        >
          {isFreeWrite ? "Open page" : "Prompt"}
        </Text>
        <Text className="font-displayItalic text-lg leading-7" style={{ color: colors.ink }}>
          {helper}
        </Text>
      </GlassCard>

      <Text className="font-sansMedium mb-3" style={{ color: colors.ink }}>
        Mood (optional)
      </Text>
      <MoodPicker
        value={moodScore}
        onChange={(s, l) => {
          setMoodScore(s);
          setMoodLabel(l);
        }}
      />
      <View className="h-4" />

      <Field label="Your words" value={body} onChangeText={setBody} multiline placeholder="Start here…" />

      <GlassCard className="mb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="font-sansMedium" style={{ color: colors.ink }}>
              AI reflection
            </Text>
            <Text className="font-sans text-xs mt-1" style={{ color: colors.muted, lineHeight: 17 }}>
              Off by default. Your entry always saves either way.
            </Text>
          </View>
          <Switch
            value={wantAiReflection}
            onValueChange={setWantAiReflection}
            trackColor={{ true: colors.primary, false: "rgba(254,254,254,0.2)" }}
            thumbColor={colors.ink}
            accessibilityLabel="Request AI reflection"
            accessibilityState={{ checked: wantAiReflection }}
          />
        </View>
        {wantAiReflection ? (
          <Text className="font-sans text-xs mt-3" style={{ color: colors.secondary, lineHeight: 17 }}>
            {AI_DISCLOSURE_SHORT}
          </Text>
        ) : null}
      </GlassCard>

      <Button
        title={
          save.isPending
            ? wantAiReflection
              ? "Saving & reflecting…"
              : "Saving…"
            : wantAiReflection
              ? "Save & get AI reflection"
              : "Save entry"
        }
        onPress={() => save.mutate()}
        loading={save.isPending}
        disabled={body.trim().length < 1}
      />
    </Screen>
  );
}
