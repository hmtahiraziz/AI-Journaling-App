import { Image, Text, View, useWindowDimensions } from "react-native";
import { colors } from "@/src/theme/colors";

/** Transparent mark only — no glow ring, no baked black tile. */
const logoMark = require("../../assets/images/logo-mark.png");

type Props = {
  large?: boolean;
  /** Hide tagline under the wordmark */
  compact?: boolean;
  /** Auth / tight layouts: smaller mark, less vertical space */
  dense?: boolean;
};

export function BrandMark({ large, compact, dense }: Props) {
  const { width } = useWindowDimensions();
  const narrow = width < 360;

  let markSize: number;
  if (dense) {
    markSize = narrow ? 56 : 64;
  } else if (large) {
    markSize = narrow ? 88 : 100;
  } else {
    markSize = narrow ? 48 : 56;
  }

  return (
    <View className="items-center" style={{ width: "100%" }}>
      <Image
        source={logoMark}
        style={{ width: markSize, height: markSize }}
        resizeMode="contain"
        accessibilityLabel="Journal IQ"
      />
      <Text
        className={`font-display ${
          dense ? "text-3xl" : large ? (narrow ? "text-4xl" : "text-5xl") : "text-3xl"
        }`}
        style={{ color: colors.ink, marginTop: dense ? 10 : large ? 12 : 10 }}
      >
        Journal <Text style={{ color: colors.primary }}>IQ</Text>
      </Text>
      {!compact ? (
        <Text
          className="font-sans tracking-wide"
          style={{
            color: colors.muted,
            fontSize: dense ? 13 : large ? 14 : 13,
            marginTop: dense ? 4 : 8,
            textAlign: "center",
            maxWidth: 280,
          }}
        >
          Reflect with clarity
        </Text>
      ) : null}
    </View>
  );
}
