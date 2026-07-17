import { Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  isPresetTime,
  REMINDER_TIME_PRESETS,
} from "@/src/constants/reminderPresets";
import { formatNextNudge, formatTime } from "@/src/store/reminders";
import { colors, radii } from "@/src/theme/colors";

type Props = {
  hour: number;
  minute: number;
  showExpoGoNote?: boolean;
  onOpenPicker: () => void;
  onSelectTime: (hour: number, minute: number) => void;
};

export function ReminderTimeBlock({
  hour,
  minute,
  showExpoGoNote,
  onOpenPicker,
  onSelectTime,
}: Props) {
  const timeLabel = formatTime(hour, minute);

  return (
    <View className="mt-2">
      <Text
        className="font-sansMedium text-xs tracking-widest uppercase mb-2"
        style={{ color: colors.muted }}
      >
        Every day at
      </Text>

      <Pressable
        onPress={onOpenPicker}
        accessibilityRole="button"
        accessibilityLabel={`Reminder time, ${timeLabel}. Double tap to change.`}
        className="min-h-[64px] flex-row items-center justify-between rounded-2xl px-4"
        style={{
          backgroundColor: colors.glassStrong,
          borderWidth: 1,
          borderColor: colors.glassBorder,
        }}
      >
        <Text className="font-display text-3xl" style={{ color: colors.primary }}>
          {timeLabel}
        </Text>
        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      </Pressable>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingVertical: 12 }}
      >
        {REMINDER_TIME_PRESETS.map((preset) => {
          const selected = isPresetTime(hour, minute, preset);
          return (
            <Pressable
              key={preset.label}
              onPress={() => onSelectTime(preset.hour, preset.minute)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: radii.tile,
                backgroundColor: selected ? "rgba(196,229,98,0.22)" : colors.glass,
                borderWidth: 1,
                borderColor: selected ? colors.primary : colors.glassBorder,
              }}
            >
              <Text
                className="font-sansMedium text-sm"
                style={{ color: selected ? colors.primary : colors.ink }}
              >
                {preset.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text className="font-sans text-sm" style={{ color: colors.muted }}>
        {formatNextNudge(hour, minute)}
      </Text>

      {showExpoGoNote ? (
        <Text className="font-sans text-sm mt-2" style={{ color: colors.muted }}>
          Expo Go won’t deliver Android reminders. Use a development or preview build for real
          notifications.
        </Text>
      ) : null}
    </View>
  );
}
