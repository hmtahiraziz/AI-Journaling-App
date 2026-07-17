import { useEffect } from "react";
import { Platform, StyleSheet, View, Pressable } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from "react-native-reanimated";
import { colors, elevation, radii } from "@/src/theme/colors";
import {
  TAB_CONTENT_NUDGE_Y,
  TAB_DOCK_HEIGHT,
  TAB_DOCK_INSET,
  TAB_FLOAT_GAP,
  TAB_ICON_SIZE,
  TAB_ORB_LIFT,
  TAB_ORB_SIZE,
  TAB_ORB_SLOT,
  TAB_SAFE_BOTTOM_FLOOR,
} from "@/src/constants/tabBar";

const SPRING = { damping: 16, stiffness: 220, mass: 0.6 };
const ACTIVE_DOT = 4;
/** Compact hit target — keeps icon + pill optically centered in the dock. */
const PILL_SIZE = Math.round(TAB_ICON_SIZE + 12);

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Icon-only tab: spring scale, soft lime pill, color crossfade, active dot. */
function TabIcon({
  name,
  accessibilityLabel,
  focused,
}: {
  name: keyof typeof Ionicons.glyphMap;
  accessibilityLabel: string;
  focused: boolean;
}) {
  const progress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(focused ? 1 : 0, SPRING);
  }, [focused, progress]);

  const iconWrapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(progress.value, [0, 1], [1, 1.08]) }],
  }));

  const mutedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [1, 0]),
  }));

  const activeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
  }));

  const pillStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.72, 1]) }],
  }));

  const dotStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.4, 1]) }],
  }));

  return (
    <View
      accessible
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: focused }}
      style={styles.tabItem}
    >
      <View style={styles.tabCluster}>
        <Animated.View style={[styles.iconStack, iconWrapStyle]}>
          <Animated.View pointerEvents="none" style={[styles.activePill, pillStyle]} />
          <Animated.View style={[StyleSheet.absoluteFillObject, styles.iconCenter, mutedStyle]}>
            <Ionicons name={name} size={TAB_ICON_SIZE} color={colors.muted} />
          </Animated.View>
          <Animated.View style={[styles.iconCenter, activeStyle]}>
            <Ionicons name={name} size={TAB_ICON_SIZE} color={colors.primary} />
          </Animated.View>
        </Animated.View>
        <Animated.View style={[styles.activeDot, dotStyle]} />
      </View>
    </View>
  );
}

function WriteOrb() {
  const router = useRouter();
  const scale = useSharedValue(1);

  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.orbSlot} pointerEvents="box-none">
      <AnimatedPressable
        onPress={() => router.push("/(app)/write")}
        accessibilityLabel="Add new entry"
        accessibilityRole="button"
        onPressIn={() => {
          scale.value = withSpring(0.94, SPRING);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, SPRING);
        }}
        style={[styles.orbButton, anim]}
      >
        <View style={styles.orbCircle}>
          <Ionicons name="add" size={Math.round(TAB_ORB_SIZE * 0.5)} color={colors.night} />
        </View>
      </AnimatedPressable>
    </View>
  );
}

/** Liquid-glass floating dock — blur + light wash so Home tiles tint through. */
function DockBackground() {
  const shell = (
    <>
      {/* Soft vertical liquid sheen */}
      <LinearGradient
        colors={["rgba(254,254,254,0.14)", "rgba(1,18,47,0.08)", "rgba(1,18,47,0.28)"]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {/* Top rim highlight */}
      <View pointerEvents="none" style={styles.dockHighlight} />
    </>
  );

  if (Platform.OS === "ios") {
    return (
      <View style={[StyleSheet.absoluteFill, styles.dockClip]}>
        <BlurView intensity={78} tint="dark" style={StyleSheet.absoluteFill}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(1,18,47,0.46)" }]} />
          {shell}
        </BlurView>
      </View>
    );
  }

  // Android: BlurView when supported; frosted fallback still reads as glass vs solid bar
  return (
    <View style={[StyleSheet.absoluteFill, styles.dockClip]}>
      <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFill}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(1,18,47,0.62)" }]} />
        {shell}
      </BlurView>
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const dockBottom = Math.max(insets.bottom, TAB_SAFE_BOTTOM_FLOOR) + TAB_FLOAT_GAP;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: "absolute",
          left: TAB_DOCK_INSET,
          right: TAB_DOCK_INSET,
          bottom: dockBottom,
          height: TAB_DOCK_HEIGHT,
          paddingBottom: 0,
          paddingTop: 0,
          margin: 0,
          borderRadius: radii.dock,
          borderTopWidth: 0,
          backgroundColor: "transparent",
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.glassBorder,
          overflow: "visible",
          ...elevation.dock,
        },
        // Dock is already lifted above system nav — don't add safe-area padding inside the bar
        safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 },
        tabBarItemStyle: {
          flex: 1,
          height: TAB_DOCK_HEIGHT,
          paddingTop: 0,
          paddingBottom: 0,
          margin: 0,
          justifyContent: "center",
          alignItems: "center",
        },
        tabBarIconStyle: {
          marginTop: TAB_CONTENT_NUDGE_Y,
          marginBottom: -TAB_CONTENT_NUDGE_Y,
        },
        tabBarBackground: () => <DockBackground />,
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
              name={focused ? "home" : "home-outline"}
              accessibilityLabel="Home"
              focused={focused}
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
              name={focused ? "book" : "book-outline"}
              accessibilityLabel="My Journal"
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "Add New",
          tabBarButton: () => <WriteOrb />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: "Insights",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? "stats-chart" : "stats-chart-outline"}
              accessibilityLabel="Insights"
              focused={focused}
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
              name={focused ? "settings" : "settings-outline"}
              accessibilityLabel="Settings"
              focused={focused}
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
  dockClip: {
    borderRadius: radii.dock,
    overflow: "hidden",
  },
  dockHighlight: {
    position: "absolute",
    top: 0,
    left: 12,
    right: 12,
    height: StyleSheet.hairlineWidth * 2,
    borderRadius: 1,
    backgroundColor: colors.glassHighlight,
    opacity: 0.9,
  },
  tabItem: {
    height: TAB_DOCK_HEIGHT,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  tabCluster: {
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  iconStack: {
    width: PILL_SIZE,
    height: PILL_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  activePill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: PILL_SIZE / 2,
    backgroundColor: colors.primaryGlowSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(196,229,98,0.28)",
  },
  iconCenter: {
    alignItems: "center",
    justifyContent: "center",
  },
  activeDot: {
    width: ACTIVE_DOT,
    height: ACTIVE_DOT,
    borderRadius: ACTIVE_DOT / 2,
    backgroundColor: colors.primary,
  },
  orbSlot: {
    width: TAB_ORB_SLOT,
    height: TAB_DOCK_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  orbButton: {
    position: "absolute",
    top: -TAB_ORB_LIFT + TAB_CONTENT_NUDGE_Y,
    width: TAB_ORB_SIZE,
    height: TAB_ORB_SIZE,
    borderRadius: TAB_ORB_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  orbCircle: {
    width: TAB_ORB_SIZE,
    height: TAB_ORB_SIZE,
    borderRadius: TAB_ORB_SIZE / 2,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: "rgba(254,254,254,0.38)",
  },
});
