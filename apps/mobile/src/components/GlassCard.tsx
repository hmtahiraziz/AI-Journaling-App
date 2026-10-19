import { ReactNode } from "react";
import { Platform, View, ViewProps } from "react-native";
import { BlurView } from "expo-blur";
import { colors, elevation, radii } from "@/src/theme/colors";

type Props = ViewProps & {
  children: ReactNode;
  className?: string;
  intensity?: number;
  /** Skip drop shadow / elevation (cleaner on stacked screens). */
  flat?: boolean;
};

export function GlassCard({
  children,
  className,
  intensity = 40,
  flat = false,
  style,
  ...rest
}: Props) {
  return (
    <View
      className={className}
      style={[
        {
          borderRadius: radii.card,
          ...(flat
            ? {
                shadowOpacity: 0,
                shadowRadius: 0,
                shadowOffset: { width: 0, height: 0 },
                elevation: 0,
              }
            : elevation.card),
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
          <BlurView
            intensity={intensity}
            tint="dark"
            style={{ flexGrow: 1, overflow: "hidden", borderRadius: radii.card }}
          >
            <View
              style={{
                backgroundColor: "rgba(1,18,47,0.45)",
                padding: 18,
                overflow: "hidden",
                borderRadius: radii.card,
              }}
            >
              {children}
            </View>
          </BlurView>
        ) : (
          <View
            style={{
              backgroundColor: "rgba(1,18,47,0.82)",
              padding: 18,
              overflow: "hidden",
              borderRadius: radii.card,
            }}
          >
            {children}
          </View>
        )}
      </View>
    </View>
  );
}
