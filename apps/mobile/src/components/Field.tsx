import { Text, TextInput, View, Pressable } from "react-native";
import { useState } from "react";
import { colors } from "@/src/theme/colors";

type Props = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "email-address" | "number-pad";
  error?: string;
};

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  multiline,
  autoCapitalize = "sentences",
  keyboardType = "default",
  error,
}: Props) {
  const [hidden, setHidden] = useState(!!secureTextEntry);

  return (
    <View className="mb-4">
      <Text className="font-sansMedium text-sm mb-2" style={{ color: colors.muted }}>
        {label}
      </Text>
      <View className="relative">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(254,254,254,0.35)"
          secureTextEntry={secureTextEntry ? hidden : false}
          multiline={multiline}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          className={`rounded-2xl px-4 py-3.5 font-sans text-base ${multiline ? "min-h-[160px]" : "min-h-[52px]"}`}
          style={{
            backgroundColor: colors.glassStrong,
            borderWidth: 1,
            borderColor: error ? "#FF6B6B" : colors.glassBorder,
            color: colors.ink,
            textAlignVertical: multiline ? "top" : "center",
            paddingRight: secureTextEntry ? 72 : 16,
          }}
        />
        {secureTextEntry ? (
          <Pressable
            onPress={() => setHidden((v) => !v)}
            hitSlop={12}
            style={{ position: "absolute", right: 14, top: 0, bottom: 0, justifyContent: "center" }}
          >
            <Text className="font-sansMedium text-sm" style={{ color: colors.secondary }}>
              {hidden ? "Show" : "Hide"}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text className="font-sans text-xs mt-1.5" style={{ color: "#FF8A8A" }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
