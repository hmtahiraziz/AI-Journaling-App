import { Text, View, ActivityIndicator, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Screen } from "@/src/components/Screen";
import { GlassCard } from "@/src/components/GlassCard";
import { getJournal } from "@/src/api/journals.api";
import { colors } from "@/src/theme/colors";

export default function EntryDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const entry = useQuery({
    queryKey: ["journal", id],
    queryFn: () => getJournal(String(id)),
    enabled: Boolean(id),
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
              </GlassCard>
            </Animated.View>
          ) : null}
        </>
      )}
    </Screen>
  );
}
