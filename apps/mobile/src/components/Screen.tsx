import { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
  View,
  ViewProps,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/src/theme/colors";

type ScreenProps = ViewProps & {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: ("top" | "bottom" | "left" | "right")[];
  /** Quieter ambient blobs — better contrast for dense lists (Journal). */
  ambient?: "default" | "subtle" | "none";
};

export function Screen({
  children,
  scroll = true,
  padded = true,
  edges = ["top", "left", "right"],
  ambient = "default",
  className,
  ...rest
}: ScreenProps & { className?: string }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const horizontalPad = width < 360 ? 16 : width < 414 ? 20 : 24;
  const bottomPad = width < 360 ? 28 : 48;
  /** Extra breathing room under notch when top edge is handled by SafeAreaView. */
  const topBreathing = Math.min(8, Math.max(4, insets.top > 0 ? 6 : 8));

  const padStyle = padded
    ? { paddingHorizontal: horizontalPad, paddingTop: topBreathing, width: "100%" as const }
    : { width: "100%" as const };

  const content = scroll ? (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        flexGrow: 1,
        paddingBottom: bottomPad,
        paddingHorizontal: padded ? horizontalPad : 0,
        paddingTop: padded ? topBreathing : 0,
      }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
      bounces
    >
      <View style={{ width: "100%", maxWidth: 520, alignSelf: "center" }}>{children}</View>
    </ScrollView>
  ) : (
    <View style={[{ flex: 1 }, padStyle]}>{children}</View>
  );

  const limeOpacity = ambient === "none" ? 0 : ambient === "subtle" ? 0.05 : 0.1;
  const cyanOpacity = ambient === "none" ? 0 : ambient === "subtle" ? 0.04 : 0.08;

  return (
    <View style={{ flex: 1, backgroundColor: colors.night }}>
      <LinearGradient
        colors={[colors.night, "#02183F", colors.nightDeep]}
        locations={[0, 0.45, 1]}
        style={{ flex: 1 }}
      >
        {ambient !== "none" ? (
          <>
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: -80,
                right: -60,
                width: 220,
                height: 220,
                borderRadius: 110,
                backgroundColor: `rgba(196,229,98,${limeOpacity})`,
              }}
            />
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                bottom: 120,
                left: -80,
                width: 260,
                height: 260,
                borderRadius: 130,
                backgroundColor: `rgba(0,207,238,${cyanOpacity})`,
              }}
            />
          </>
        ) : null}
        <SafeAreaView style={{ flex: 1 }} edges={edges}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
          >
            <View
              style={{ flex: 1, width: "100%", maxWidth: 520, alignSelf: "center" }}
              {...rest}
            >
              {content}
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
