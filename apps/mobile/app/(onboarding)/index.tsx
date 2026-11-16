import { useCallback, useRef, useState } from "react";
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Screen } from "@/src/components/Screen";
import { BrandMark } from "@/src/components/BrandMark";
import { Button } from "@/src/components/Button";
import { GlassCard } from "@/src/components/GlassCard";
import { useOnboardingStore } from "@/src/store/onboarding";
import { colors } from "@/src/theme/colors";

const SLIDES = [
  {
    id: "1",
    eyebrow: "Daily prompts",
    title: "Notice what matters",
    body: "Gentle writing prompts that meet you where you are — or free-write anytime.",
    accent: colors.primary,
  },
  {
    id: "2",
    eyebrow: "AI reflection",
    title: "Gain a kinder perspective",
    body: "Short, supportive reflections after you write. Never clinical. Never diagnostic.",
    accent: colors.secondary,
  },
  {
    id: "3",
    eyebrow: "Private by design",
    title: "Your words stay yours",
    body: "Entries live privately on your account, with an optional PIN or biometric lock.",
    accent: colors.ink,
  },
  {
    id: "4",
    eyebrow: "Privacy & terms",
    title: "Clear about your data",
    body: "We collect email, journals, and moods to run the app. AI may process entries you submit for reflections — never as therapy or diagnosis. Export or delete anytime.",
    accent: colors.mint,
  },
] as const;

export default function OnboardingScreen() {
  const router = useRouter();
  const complete = useOnboardingStore((s) => s.complete);
  const { width, height } = useWindowDimensions();
  const horizontalPad = width < 360 ? 16 : width < 414 ? 20 : 24;
  /** Full column width so cards slide flush to the screen edge (cancels Screen pad). */
  const pageWidth = Math.min(width, 520);
  const compact = height < 720 || width < 360;
  /** Shared inner min-height so every slide card matches the tallest copy. */
  const cardInnerMin = compact ? 168 : 192;

  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<(typeof SLIDES)[number]>>(null);
  const progress = useSharedValue(0);

  const ctaStyle = useAnimatedStyle(() => {
    const last = SLIDES.length - 1;
    const onLast = interpolate(progress.value, [last - 0.8, last], [0, 1], "clamp");
    return {
      opacity: onLast,
      transform: [{ translateY: interpolate(onLast, [0, 1], [16, 0]) }],
    };
  });

  const nextStyle = useAnimatedStyle(() => {
    const last = SLIDES.length - 1;
    const onLast = interpolate(progress.value, [last - 0.8, last], [0, 1], "clamp");
    return {
      opacity: 1 - onLast,
      transform: [{ translateY: interpolate(onLast, [0, 1], [0, 12]) }],
    };
  });

  async function go(path: "/(auth)/signup" | "/(auth)/signin") {
    await complete();
    router.replace(path);
  }

  function goNext() {
    if (index >= SLIDES.length - 1) {
      go("/(auth)/signup");
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  }

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      progress.value = pageWidth > 0 ? x / pageWidth : 0;
    },
    [pageWidth, progress]
  );

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const next = Math.round(pageWidth > 0 ? x / pageWidth : 0);
      const clamped = Math.max(0, Math.min(SLIDES.length - 1, next));
      setIndex(clamped);
      progress.value = withTiming(clamped, {
        duration: 180,
        easing: Easing.out(Easing.cubic),
      });
    },
    [pageWidth, progress]
  );

  const titleSize = compact ? 24 : 28;
  const bodySize = compact ? 15 : 16;

  const renderItem = useCallback(
    ({ item }: { item: (typeof SLIDES)[number] }) => (
      <View style={{ width: pageWidth }}>
        <GlassCard>
          <View style={{ minHeight: cardInnerMin }}>
            <Text
              style={{
                color: item.accent,
                fontFamily: "DMSans_500Medium",
                fontSize: 12,
                letterSpacing: 1.4,
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              {item.eyebrow}
            </Text>
            <Text
              style={{
                color: colors.ink,
                fontFamily: "Fraunces_600SemiBold",
                fontSize: titleSize,
                lineHeight: titleSize + 8,
                marginBottom: 12,
              }}
            >
              {item.title}
            </Text>
            <Text
              style={{
                color: colors.muted,
                fontFamily: "DMSans_400Regular",
                fontSize: bodySize,
                lineHeight: bodySize + 8,
              }}
            >
              {item.body}
            </Text>
          </View>
        </GlassCard>
      </View>
    ),
    [pageWidth, cardInnerMin, titleSize, bodySize]
  );

  return (
    <Screen scroll={false} edges={["top", "left", "right", "bottom"]} ambient="subtle">
      <View
        style={{
          flex: 1,
          justifyContent: "space-between",
          paddingBottom: 4,
        }}
      >
        {/* Hero brand band */}
        <View
          style={{
            alignItems: "center",
            paddingTop: compact ? 4 : 10,
            paddingBottom: compact ? 6 : 12,
          }}
        >
          <BrandMark large />
        </View>

        {/* Single content job: slides + progress */}
        <View style={{ flex: 1, justifyContent: "center", minHeight: 160 }}>
          <FlatList
            ref={listRef}
            data={[...SLIDES]}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            bounces={false}
            decelerationRate="fast"
            snapToInterval={pageWidth}
            snapToAlignment="start"
            disableIntervalMomentum
            getItemLayout={(_, i) => ({
              length: pageWidth,
              offset: pageWidth * i,
              index: i,
            })}
            onScroll={onScroll}
            onMomentumScrollEnd={onMomentumScrollEnd}
            scrollEventThrottle={16}
            renderItem={renderItem}
            style={{
              flexGrow: 0,
              marginHorizontal: -horizontalPad,
              width: pageWidth,
            }}
          />

          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              gap: 8,
              marginTop: compact ? 16 : 22,
            }}
          >
            {SLIDES.map((s, i) => (
              <View
                key={s.id}
                style={{
                  width: i === index ? 22 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: i === index ? colors.primary : "rgba(254,254,254,0.22)",
                }}
              />
            ))}
          </View>
        </View>

        {/* CTA dock — both button pairs share the same bottom slot */}
        <View style={{ marginTop: compact ? 12 : 18 }}>
          <View style={{ height: 52 + 12 + 52, position: "relative" }}>
            <Animated.View
              style={[nextStyle, { position: "absolute", left: 0, right: 0, bottom: 0 }]}
              pointerEvents={index < SLIDES.length - 1 ? "auto" : "none"}
            >
              <Button title="Continue" onPress={goNext} />
              <View style={{ height: 12 }} />
              <Button title="Skip to sign in" variant="ghost" onPress={() => go("/(auth)/signin")} />
            </Animated.View>

            <Animated.View
              style={[ctaStyle, { position: "absolute", left: 0, right: 0, bottom: 0 }]}
              pointerEvents={index === SLIDES.length - 1 ? "auto" : "none"}
            >
              <Button title="Get started" onPress={() => go("/(auth)/signup")} />
              <View style={{ height: 12 }} />
              <Button
                title="I already have an account"
                variant="secondary"
                onPress={() => go("/(auth)/signin")}
              />
            </Animated.View>
          </View>

          {index === SLIDES.length - 1 ? (
            <Animated.View
              style={[
                ctaStyle,
                {
                  flexDirection: "row",
                  justifyContent: "center",
                  flexWrap: "wrap",
                  marginTop: 14,
                  gap: 4,
                },
              ]}
            >
              <Pressable onPress={() => router.push("/(legal)/privacy")} hitSlop={8}>
                <Text style={{ color: colors.secondary, fontFamily: "DMSans_500Medium", fontSize: 13 }}>
                  Privacy Policy
                </Text>
              </Pressable>
              <Text style={{ color: colors.muted, fontFamily: "DMSans_400Regular", fontSize: 13 }}>
                ·
              </Text>
              <Pressable onPress={() => router.push("/(legal)/terms")} hitSlop={8}>
                <Text style={{ color: colors.secondary, fontFamily: "DMSans_500Medium", fontSize: 13 }}>
                  Terms of Service
                </Text>
              </Pressable>
            </Animated.View>
          ) : null}
        </View>
      </View>
    </Screen>
  );
}
