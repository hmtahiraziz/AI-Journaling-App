import { Pressable, Text, View } from "react-native";
import { MOODS } from "@/src/constants/moods";
import { colors } from "@/src/theme/colors";

type Props = {
  value?: number | null;
  onChange: (score: number, label: string) => void;
};

export function MoodPicker({ value, onChange }: Props) {
  return (
    <View className="flex-row justify-between gap-2">
      {MOODS.map((m) => {
        const selected = value === m.score;
        const t = (m.score - 1) / 4;
        const accent = t < 0.5 ? colors.secondary : colors.primary;
        return (
          <Pressable
            key={m.score}
            onPress={() => onChange(m.score, m.label.replace("!", ""))}
            className="flex-1 items-center rounded-2xl py-3 min-h-[72px] justify-center"
            style={{
              backgroundColor: selected ? accent : colors.glassStrong,
              borderWidth: 1,
              borderColor: selected ? accent : colors.glassBorder,
            }}
          >
            <Text style={{ fontSize: 22, marginBottom: 4 }}>{m.emoji}</Text>
            <Text
              className="text-[10px] font-sansMedium"
              style={{ color: selected ? colors.night : colors.muted }}
            >
              {m.label.replace("!", "")}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
