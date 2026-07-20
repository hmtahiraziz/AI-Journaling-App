import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useToastStore, type ToastVariant } from "@/src/store/toast";
import { colors, elevation, radii } from "@/src/theme/colors";
import { tabDockBottom, TAB_DOCK_HEIGHT, TAB_ORB_LIFT } from "@/src/constants/tabBar";

const ACCENT: Record<ToastVariant, string> = {
  success: colors.primary,
  error: "#FF8A8A",
  info: colors.secondary,
};

export function ToastHost() {
  const insets = useSafeAreaInsets();
  const current = useToastStore((s) => s.current);
  const hide = useToastStore((s) => s.hide);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);

  useEffect(() => {
    if (!current) {
      opacity.value = withTiming(0, { duration: 160, easing: Easing.out(Easing.cubic) });
      translateY.value = withTiming(12, { duration: 160, easing: Easing.out(Easing.cubic) });
      return;
    }
    opacity.value = 0;
    translateY.value = 16;
    opacity.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
    translateY.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic) });
  }, [current, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!current) return null;

  const bottom =
    tabDockBottom(insets.bottom) + TAB_DOCK_HEIGHT + TAB_ORB_LIFT + 12;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom,
        zIndex: 1000,
        alignItems: "center",
        paddingHorizontal: 20,
      }}
    >
      <Animated.View style={[{ maxWidth: 420, width: "100%" }, animatedStyle]}>
        <Pressable onPress={hide} accessibilityRole="button" accessibilityLabel="Dismiss message">
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              borderRadius: radii.card,
              paddingVertical: 14,
              paddingHorizontal: 16,
              backgroundColor: colors.glassStrong,
              borderWidth: 1,
              borderColor: colors.glassBorder,
              ...elevation.card,
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: ACCENT[current.variant],
              }}
            />
            <Text
              style={{
                flex: 1,
                color: colors.ink,
                fontFamily: "DMSans_500Medium",
                fontSize: 14,
                lineHeight: 20,
              }}
              numberOfLines={3}
            >
              {current.message}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}
