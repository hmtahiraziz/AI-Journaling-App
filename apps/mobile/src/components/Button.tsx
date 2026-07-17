import { Pressable, Text, ActivityIndicator } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { colors } from "@/src/theme/colors";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
  disabled?: boolean;
};

export function Button({ title, onPress, variant = "primary", loading, disabled }: Props) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const base = "rounded-2xl px-5 py-4 items-center justify-center min-h-[52px]";
  const styles =
    variant === "primary"
      ? ""
      : variant === "secondary"
        ? "border"
        : "bg-transparent";

  const bg =
    variant === "primary"
      ? colors.primary
      : variant === "secondary"
        ? colors.glassStrong
        : "transparent";

  const textColor =
    variant === "primary" ? colors.night : colors.ink;

  return (
    <AnimatedPressable
      className={`${base} ${styles} ${disabled || loading ? "opacity-60" : ""}`}
      style={[
        anim,
        {
          backgroundColor: bg,
          borderColor: variant === "secondary" ? colors.glassBorder : "transparent",
          minHeight: 52,
        },
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      onPressIn={() => {
        scale.value = withSpring(0.97);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? colors.night : colors.primary} />
      ) : (
        <Text className="font-sansMedium text-base" style={{ color: textColor }}>
          {title}
        </Text>
      )}
    </AnimatedPressable>
  );
}
