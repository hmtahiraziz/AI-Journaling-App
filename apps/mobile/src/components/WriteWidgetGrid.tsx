import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import type { ReactNode } from "react";
import { colors, elevation, radii } from "@/src/theme/colors";
import { type } from "@/src/theme/typography";

const SPRING = { damping: 16, stiffness: 240, mass: 0.55 };
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function TileIcon({
  name,
  bg,
  iconColor,
}: {
  name: keyof typeof Ionicons.glyphMap;
  bg: string;
  iconColor: string;
}) {
  return (
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name={name} size={20} color={iconColor} />
    </View>
  );
}

function Arrow({ color }: { color: string }) {
  return (
    <Ionicons
      name="arrow-up-outline"
      size={18}
      color={color}
      style={{ transform: [{ rotate: "45deg" }] }}
    />
  );
}

function ActionTile({
  onPress,
  accessibilityLabel,
  backgroundColor,
  borderRadius,
  flex,
  children,
}: {
  onPress: () => void;
  accessibilityLabel: string;
  backgroundColor: string;
  borderRadius: number;
  flex?: number;
  children: ReactNode;
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPressIn={() => {
        scale.value = withSpring(0.97, SPRING);
        opacity.value = withSpring(0.92, SPRING);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, SPRING);
        opacity.value = withSpring(1, SPRING);
      }}
      style={[
        {
          flex: flex ?? 1,
          borderRadius,
          backgroundColor,
          padding: 16,
          justifyContent: "space-between",
          ...elevation.card,
        },
        anim,
      ]}
    >
      {children}
    </AnimatedPressable>
  );
}

/** Responsive tall-left + stacked-right action grid. */
export function WriteWidgetGrid() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const gap = width < 360 ? 10 : 12;
  const height = Math.round(Math.max(176, Math.min(220, width * 0.5)));

  return (
    <View style={{ flexDirection: "row", gap, height, marginBottom: 20, width: "100%" }}>
      <ActionTile
        onPress={() => router.push("/(app)/write?mode=prompt")}
        accessibilityLabel="Prompt Journal"
        backgroundColor={colors.primary}
        borderRadius={radii.tileLg}
        flex={1.12}
      >
        <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
          <TileIcon name="create-outline" bg="rgba(1,18,47,0.16)" iconColor={colors.night} />
          <Arrow color={colors.night} />
        </View>
        <Text
          className="font-sansBold"
          style={{ color: colors.night, fontSize: type.title.fontSize, lineHeight: type.title.lineHeight }}
        >
          Prompt{"\n"}Journal
        </Text>
      </ActionTile>

      <View style={{ flex: 1, gap, minWidth: 0 }}>
        <ActionTile
          onPress={() => router.push("/(app)/write?mode=free")}
          accessibilityLabel="Free-write"
          backgroundColor={colors.secondary}
          borderRadius={radii.tile}
        >
          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
            <TileIcon name="document-text-outline" bg="rgba(1,18,47,0.16)" iconColor={colors.night} />
            <Arrow color={colors.night} />
          </View>
          <Text
            className="font-sansBold"
            style={{ color: colors.night, fontSize: type.body.fontSize, lineHeight: type.body.lineHeight }}
          >
            Free-write
          </Text>
        </ActionTile>

        <ActionTile
          onPress={() => router.push("/(app)/(tabs)/mood")}
          accessibilityLabel="Log mood"
          backgroundColor={colors.mint}
          borderRadius={radii.tile}
        >
          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
            <TileIcon name="happy-outline" bg="rgba(1,18,47,0.16)" iconColor={colors.night} />
            <Arrow color={colors.night} />
          </View>
          <Text
            className="font-sansBold"
            style={{ color: colors.night, fontSize: type.body.fontSize, lineHeight: type.body.lineHeight }}
          >
            Log mood
          </Text>
        </ActionTile>
      </View>
    </View>
  );
}
