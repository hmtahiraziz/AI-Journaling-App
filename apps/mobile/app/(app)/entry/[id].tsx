import { Text, View, ActivityIndicator, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Screen } from "@/src/components/Screen";
import { GlassCard } from "@/src/components/GlassCard";
import { Button } from "@/src/components/Button";
import { ReportAiButton } from "@/src/components/ReportAiButton";
import { getJournal, reflectOnJournal } from "@/src/api/journals.api";
import { getErrorMessage } from "@/src/api/client";
import { toast } from "@/src/lib/toast";
import { colors } from "@/src/theme/colors";
import { AI_DISCLOSURE_SHORT } from "@/src/constants/support";
import { MEDICAL_DISCLAIMER_SHORT } from "@/src/constants/disclaimer";

export default function EntryDetailScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const entry = useQuery({
    queryKey: ["journal", id],
    queryFn: () => getJournal(String(id)),
    enabled: Boolean(id),
  });

  const reflect = useMutation({
    mutationFn: () => reflectOnJournal(String(id)),
    onSuccess: (updated) => {
      qc.setQueryData(["journal", id], updated);
      qc.invalidateQueries({ queryKey: ["journals"] });
      toast.success("Reflection ready");
    },
    onError: (e) => toast.error(getErrorMessage(e, "Couldn’t get reflection")),
  });

  return (
    <Screen>
      <Pressable onPress={() => router.back()} className="mb-4 min-h-[44px] justify-center">
        <Text className="font-sansMedium" style={{ color: colors.secondary }}>
          ← Back
        </Text>
      </Pressable>

      {entry.isLoading || !entry.data ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <>
          <Text className="font-sans text-sm" style={{ color: colors.muted }}>
            {new Date(entry.data.createdAt).toLocaleString()}
          </Text>
          {entry.data.prompt && !entry.data.isFreeWrite ? (
            <Text className="font-displayItalic text-lg mt-3 leading-7" style={{ color: colors.secondary }}>
              {entry.data.prompt.text}
            </Text>
          ) : (
            <Text className="font-sansMedium mt-3" style={{ color: colors.primary }}>
              Free write
            </Text>
          )}

          <View className="mt-5">
            <GlassCard>
              <Text className="font-sans text-base leading-7" style={{ color: colors.ink }}>
                {entry.data.body}
              </Text>
            </GlassCard>
          </View>

          {entry.data.mood ? (
            <Text className="font-sans mt-4" style={{ color: colors.muted }}>
              Mood: {entry.data.mood.label}
            </Text>
          ) : null}

          {entry.data.reflection ? (
            <Animated.View entering={FadeInDown.duration(600)} className="mt-6">
              <GlassCard>
                <Text
                  className="font-sansMedium text-xs tracking-widest uppercase mb-2"
                  style={{ color: colors.primary }}
                >
                  Gentle reflection
                </Text>
                <Text className="font-displayItalic text-lg leading-8" style={{ color: colors.ink }}>
                  {entry.data.reflection}
                </Text>
                <Text className="font-sans text-xs mt-3" style={{ color: colors.muted }}>
                  {MEDICAL_DISCLAIMER_SHORT}
                </Text>
                <ReportAiButton kind="reflection" entryId={entry.data.id} />
              </GlassCard>
            </Animated.View>
          ) : (
            <View className="mt-6">
              <GlassCard className="mb-3">
                <Text className="font-sansMedium mb-2" style={{ color: colors.ink }}>
                  Optional AI reflection
                </Text>
                <Text className="font-sans text-xs mb-4" style={{ color: colors.muted, lineHeight: 17 }}>
                  {AI_DISCLOSURE_SHORT}
                </Text>
                <Button
                  title="Get AI reflection"
                  onPress={() => reflect.mutate()}
                  loading={reflect.isPending}
                  variant="secondary"
                />
              </GlassCard>
            </View>
          )}
        </>
      )}
    </Screen>
  );
}
