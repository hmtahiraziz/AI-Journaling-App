import { Text, View, useWindowDimensions } from "react-native";
import { colors } from "@/src/theme/colors";
import { streakLabel, type StreakInfo } from "@/src/utils/streaks";

type Props = {
  info: StreakInfo;
};

/** Compact, responsive “showed up” strip — soft habit signal, not gamification. */
export function StreakStrip({ info }: Props) {
  const { width } = useWindowDimensions();
  const compact = width < 360;

  return (
    <View
      className="mb-5 flex-row items-stretch"
      style={{ gap: compact ? 8 : 10 }}
    >
      <View
        className="flex-1 rounded-2xl px-3 py-3"
        style={{
          backgroundColor: colors.glassStrong,
          borderWidth: 1,
          borderColor: colors.glassBorder,
          minHeight: compact ? 64 : 72,
          justifyContent: "center",
        }}
      >
        <Text
          className="font-sansMedium text-xs tracking-widest uppercase mb-1"
          style={{ color: colors.secondary }}
        >
          Showing up
        </Text>
        <Text
          className={compact ? "font-sansMedium text-sm" : "font-sansMedium text-base"}
          style={{ color: colors.ink }}
          numberOfLines={2}
        >
          {streakLabel(info)}
        </Text>
      </View>

      <View
        className="rounded-2xl px-3 py-3 items-center justify-center"
        style={{
          backgroundColor: "rgba(196,229,98,0.14)",
          borderWidth: 1,
          borderColor: "rgba(196,229,98,0.28)",
          minWidth: compact ? 72 : 88,
          minHeight: compact ? 64 : 72,
        }}
      >
        <Text className="font-display text-2xl" style={{ color: colors.primary }}>
          {info.daysThisWeek}
        </Text>
        <Text className="font-sans text-[10px] mt-0.5" style={{ color: colors.muted }}>
          / 7 days
        </Text>
      </View>
    </View>
  );
}
