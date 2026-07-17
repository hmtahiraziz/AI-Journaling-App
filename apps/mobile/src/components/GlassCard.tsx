import { ReactNode } from "react";
import { Platform, View, ViewProps } from "react-native";
import { BlurView } from "expo-blur";
import { colors, elevation, radii } from "@/src/theme/colors";

type Props = ViewProps & {
  children: ReactNode;
  className?: string;
  intensity?: number;
};

export function GlassCard({ children, className, intensity = 40, style, ...rest }: Props) {
  return (
    <View
      className={className}
      style={[
        {
          borderRadius: radii.card,
          ...elevation.card,
        },
        style,
      ]}
      {...rest}
    >
      <View
        style={{
          borderRadius: radii.card,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: colors.glassBorder,
          backgroundColor: Platform.OS === "android" ? "rgba(1,18,47,0.82)" : "transparent",
        }}
      >
        {Platform.OS === "ios" ? (
          <BlurView intensity={intensity} tint="dark" style={{ flexGrow: 1 }}>
            <View style={{ backgroundColor: "rgba(1,18,47,0.45)", padding: 18 }}>{children}</View>
          </BlurView>
        ) : (
          <View style={{ backgroundColor: "rgba(1,18,47,0.82)", padding: 18 }}>{children}</View>
        )}
      </View>
    </View>
  );
}
