import { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/src/components/Button";
import {
  isPresetTime,
  REMINDER_TIME_PRESETS,
} from "@/src/constants/reminderPresets";
import { colors, radii } from "@/src/theme/colors";

type Props = {
  visible: boolean;
  hour: number;
  minute: number;
  onClose: () => void;
  onSave: (hour: number, minute: number) => void;
};

function toDate(hour: number, minute: number) {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

export function ReminderTimeSheet({ visible, hour, minute, onClose, onSave }: Props) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(() => toDate(hour, minute));

  useEffect(() => {
    if (visible) setDraft(toDate(hour, minute));
  }, [visible, hour, minute]);

  const draftHour = draft.getHours();
  const draftMinute = draft.getMinutes();

  function onPickerChange(_event: DateTimePickerEvent, date?: Date) {
    if (date) setDraft(date);
  }

  function applyPreset(h: number, m: number) {
    setDraft(toDate(h, m));
  }

  function onDone() {
    onSave(draft.getHours(), draft.getMinutes());
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          className="flex-1"
          onPress={onClose}
        />
        <View
          style={{
            backgroundColor: colors.night,
            borderTopLeftRadius: radii.dock,
            borderTopRightRadius: radii.dock,
            borderTopWidth: 1,
            borderColor: colors.glassBorder,
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: Math.max(insets.bottom, 16) + 8,
          }}
        >
          <View
            style={{
              alignSelf: "center",
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: colors.glassBorder,
              marginBottom: 16,
            }}
          />

          <Text className="font-display text-2xl text-center" style={{ color: colors.ink }}>
            Reminder time
          </Text>
          <Text className="font-sans text-sm text-center mt-2 mb-4" style={{ color: colors.muted }}>
            A quiet daily nudge — no streaks required.
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
          >
            {REMINDER_TIME_PRESETS.map((preset) => {
              const selected = isPresetTime(draftHour, draftMinute, preset);
              return (
                <Pressable
                  key={preset.label}
                  onPress={() => applyPreset(preset.hour, preset.minute)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: radii.tile,
                    backgroundColor: selected ? colors.primary : colors.glassStrong,
                    borderWidth: 1,
                    borderColor: selected ? colors.primary : colors.glassBorder,
                  }}
                >
                  <Text
                    className="font-sansMedium text-sm"
                    style={{ color: selected ? colors.night : colors.ink }}
                  >
                    {preset.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View className="items-center my-2">
            <DateTimePicker
              value={draft}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "spinner"}
              onChange={onPickerChange}
              themeVariant="dark"
              textColor={colors.ink}
              style={{ width: Platform.OS === "ios" ? "100%" : 280, height: 180 }}
            />
          </View>

          <Button title="Done" onPress={onDone} />
          <View className="h-2" />
          <Button title="Cancel" variant="ghost" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}
