import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Screen } from "@/src/components/Screen";
import { colors } from "@/src/theme/colors";

type Section = { heading: string; body: string };

type Props = {
  title: string;
  updated: string;
  sections: readonly Section[];
};

export function LegalDocument({ title, updated, sections }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <Screen scroll edges={["left", "right"]} ambient="subtle">
      <View style={{ paddingTop: Math.max(insets.top, 8), paddingBottom: Math.max(insets.bottom, 28) }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={{
            flexDirection: "row",
            alignItems: "center",
            alignSelf: "flex-start",
            marginBottom: 16,
            minHeight: 44,
          }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
          <Text className="font-sansMedium ml-0.5" style={{ color: colors.primary }}>
            Back
          </Text>
        </Pressable>

        <Text
          className="font-display mb-2"
          style={{ color: colors.ink, fontSize: 28, lineHeight: 34 }}
        >
          {title}
        </Text>
        <Text className="font-sans mb-6" style={{ color: colors.muted, fontSize: 13 }}>
          Last updated: {updated}
        </Text>

        {sections.map((section) => (
          <View key={section.heading} style={{ marginBottom: 22 }}>
            <Text
              className="font-sansMedium mb-2"
              style={{ color: colors.secondary, fontSize: 15 }}
            >
              {section.heading}
            </Text>
            <Text
              className="font-sans"
              style={{ color: colors.muted, fontSize: 14, lineHeight: 22 }}
            >
              {section.body}
            </Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}
