import { useEffect, useMemo } from "react";
import { Platform, StyleSheet, View, Pressable, useWindowDimensions } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Easing,
} from "react-native-reanimated";
import { colors, elevation } from "@/src/theme/colors";
import {
  TAB_CONTENT_NUDGE_Y,
  TAB_FLOAT_GAP,
  TAB_ICON_EDGE_PAD,
  TAB_SAFE_BOTTOM_FLOOR,
  tabDockHeight,
  tabDockInset,
  tabDockWidth,
  tabIconSize,
  tabOrbLift,
  tabOrbSize,
  tabOrbSlot,
} from "@/src/constants/tabBar";

/** Soft spring — settles cleanly without bounce. */
const SPRING = { damping: 22, stiffness: 200, mass: 0.75 };
/** Liquid pill spring — slightly softer for glass settle. */
const PILL_SPRING = { damping: 20, stiffness: 180, mass: 0.8 };

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Icon-only tab — muted → primary, soft glass pill. */
function TabIcon({
  outline,
  solid,
  accessibilityLabel,
  focused,
  iconSize,
  pillSize,
}: {
  outline: keyof typeof Ionicons.glyphMap;
  solid: keyof typeof Ionicons.glyphMap;
  accessibilityLabel: string;
  focused: boolean;
  iconSize: number;
  pillSize: number;
}) {
  const progress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(focused ? 1 : 0, PILL_SPRING);
  }, [focused, progress]);

  const stackStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(progress.value, [0, 1], [1, 1.04]) }],
  }));

  const mutedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [1, 0]),
  }));

  const activeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
  }));

  const pillStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.85, 1]) }],
  }));

  return (
    <View
      accessible
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: focused }}
      style={[styles.tabItem, { width: pillSize, height: pillSize }]}
    >
      <Animated.View style={[styles.iconStack, { width: pillSize, height: pillSize }, stackStyle]}>
        <Animated.View
          pointerEvents="none"
          style={[styles.activePill, { borderRadius: pillSize / 2 }, pillStyle]}
        />
        <Animated.View style={[StyleSheet.absoluteFill, styles.iconCenter, mutedStyle]}>
          <Ionicons name={outline} size={iconSize} color={colors.muted} />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, styles.iconCenter, activeStyle]}>
          <Ionicons name={solid} size={iconSize} color={colors.primary} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

function WriteOrb({
  dockHeight,
  orbSize,
  orbLift,
  orbSlot,
}: {
  dockHeight: number;
  orbSize: number;
  orbLift: number;
  orbSlot: number;
}) {
  const router = useRouter();
  const scale = useSharedValue(1);

  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={[styles.orbSlot, { width: orbSlot, height: dockHeight }]} pointerEvents="box-none">
      <AnimatedPressable
        onPress={() => router.push("/(app)/write")}
        accessibilityLabel="Add new entry"
        accessibilityRole="button"
        onPressIn={() => {
          scale.value = withSpring(0.92, SPRING);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, SPRING);
        }}
        style={[
          styles.orbButton,
          {
            top: -orbLift + TAB_CONTENT_NUDGE_Y,
            width: orbSize,
            height: orbSize,
            borderRadius: orbSize / 2,
          },
          anim,
        ]}
      >
        <View
          style={[
            styles.orbCircle,
            {
              width: orbSize,
              height: orbSize,
              borderRadius: orbSize / 2,
            },
          ]}
        >
          <Ionicons name="add" size={Math.round(orbSize * 0.48)} color={colors.night} />
        </View>
      </AnimatedPressable>
    </View>
  );
}

/** Dark liquid-glass dock — same language as GlassCard, subtle primary wash. */
function DockBackground({ width, height }: { width: number; height: number }) {
  const radius = Math.round(height / 2);
  const shell = (
    <>
      <LinearGradient
        colors={[
          "rgba(254,254,254,0.12)",
          "rgba(196,229,98,0.28)",
          "rgba(196,229,98,0.16)",
          "rgba(1,18,47,0.28)",
        ]}
        locations={[0, 0.35, 0.7, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: colors.dockGlass }]}
      />
    </>
  );

  // Shadow on outer shell; border on clipped inner — avoids double outline.
  const glass = (
    <View
      style={[
        styles.dockShadow,
        {
          width,
          height,
          borderRadius: radius,
          ...elevation.dock,
        },
      ]}
    >
      <View
        style={[
          styles.dockPill,
          {
            width,
            height,
            borderRadius: radius,
          },
        ]}
      >
        <BlurView
          intensity={Platform.OS === "ios" ? 70 : 52}
          tint="dark"
          style={[StyleSheet.absoluteFill, { borderRadius: radius, elevation: 0 }]}
        >
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                // Higher fill opacity so the dock isn’t too see-through
                backgroundColor:
                  Platform.OS === "ios" ? "rgba(1,18,47,0.58)" : "rgba(1,18,47,0.72)",
              },
            ]}
          />
          {shell}
        </BlurView>
      </View>
    </View>
  );

  return (
    <View style={styles.dockTrack} pointerEvents="none">
      {glass}
    </View>
  );

  return (
    <View style={styles.dockTrack} pointerEvents="none">
      {glass}
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const metrics = useMemo(() => {
    const dockWidth = tabDockWidth(width);
    const dockInset = tabDockInset(width);
    const dockHeight = tabDockHeight(width);
    const iconSize = tabIconSize(width);
    const orbSize = tabOrbSize(width);
    const orbLift = tabOrbLift(width);
    const orbSlot = tabOrbSlot(orbSize);
    const pillSize = Math.round(iconSize + 12);
    return { dockWidth, dockInset, dockHeight, iconSize, orbSize, orbLift, orbSlot, pillSize };
  }, [width]);

  const dockBottom = Math.max(insets.bottom, TAB_SAFE_BOTTOM_FLOOR) + TAB_FLOAT_GAP;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: "absolute",
          left: 0,
          right: 0,
          bottom: dockBottom,
          height: metrics.dockHeight,
          paddingHorizontal: metrics.dockInset + TAB_ICON_EDGE_PAD,
          paddingBottom: 0,
          paddingTop: 0,
          margin: 0,
          borderRadius: 0,
          borderTopWidth: 0,
          borderWidth: 0,
          backgroundColor: "transparent",
          elevation: 0,
          shadowOpacity: 0,
          shadowColor: "transparent",
          overflow: "visible",
        },
        tabBarItemStyle: {
          flex: 1,
          height: metrics.dockHeight,
          paddingTop: 0,
          paddingBottom: 0,
          paddingHorizontal: 0,
          margin: 0,
          justifyContent: "center",
          alignItems: "center",
        },
        tabBarIconStyle: {
          marginTop: TAB_CONTENT_NUDGE_Y,
          marginBottom: 0,
          width: metrics.pillSize,
          height: metrics.pillSize,
        },
        tabBarBackground: () => (
          <DockBackground width={metrics.dockWidth} height={metrics.dockHeight} />
        ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              outline="home-outline"
              solid="home"
              accessibilityLabel="Home"
              focused={focused}
              iconSize={metrics.iconSize}
              pillSize={metrics.pillSize}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: "Journal",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              outline="book-outline"
              solid="book"
              accessibilityLabel="My Journal"
              focused={focused}
              iconSize={metrics.iconSize}
              pillSize={metrics.pillSize}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "Add New",
          tabBarButton: () => (
            <WriteOrb
              dockHeight={metrics.dockHeight}
              orbSize={metrics.orbSize}
              orbLift={metrics.orbLift}
              orbSlot={metrics.orbSlot}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: "Insights",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              outline="stats-chart-outline"
              solid="stats-chart"
              accessibilityLabel="Insights"
              focused={focused}
              iconSize={metrics.iconSize}
              pillSize={metrics.pillSize}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              outline="settings-outline"
              solid="settings"
              accessibilityLabel="Settings"
              focused={focused}
              iconSize={metrics.iconSize}
              pillSize={metrics.pillSize}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="mood"
        options={{
          href: null,
          title: "Mood",
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  dockTrack: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  dockShadow: {
    backgroundColor: "transparent",
  },
  dockPill: {
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: "transparent",
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  iconStack: {
    alignItems: "center",
    justifyContent: "center",
  },
  activePill: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.primaryGlowSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(196,229,98,0.22)",
  },
  iconCenter: {
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },
  orbSlot: {
    alignItems: "center",
    justifyContent: "center",
  },
  orbButton: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    ...elevation.fab,
  },
  orbCircle: {
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(254,254,254,0.32)",
  },
});
