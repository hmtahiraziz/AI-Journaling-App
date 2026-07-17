import { Image, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AvatarInitials } from "@/src/components/AvatarInitials";
import { useAuthStore } from "@/src/store/auth";
import { colors } from "@/src/theme/colors";
import { type } from "@/src/theme/typography";

const logoMark = require("../../assets/images/logo-mark.png");

type Props = {
  title?: string;
  showBrand?: boolean;
  /** When true, apply insets.top (use if parent does not already pad for status bar). */
  includeTopInset?: boolean;
};

export function AppHeader({ title, showBrand = true, includeTopInset = false }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  return (
    <View
      className="flex-row items-center justify-between mb-5"
      style={{ marginTop: includeTopInset ? Math.max(insets.top, 8) : 4 }}
    >
      {showBrand ? (
        <View className="flex-row items-center gap-2.5 flex-1">
          <Image
            source={logoMark}
            style={{ width: 30, height: 30 }}
            resizeMode="contain"
            accessibilityLabel="Journal IQ"
          />
          <Text
            className="font-sansMedium"
            style={{ color: colors.ink, fontSize: type.body.fontSize + 2, lineHeight: 24 }}
          >
            Journal <Text style={{ color: colors.primary }}>IQ</Text>
          </Text>
        </View>
      ) : (
        <Text
          className="font-display flex-1"
          numberOfLines={1}
          style={{
            color: colors.ink,
            fontSize: type.greeting.fontSize,
            lineHeight: type.greeting.lineHeight,
          }}
        >
          {title}
        </Text>
      )}

      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={() => {}}
          hitSlop={8}
          accessibilityLabel="Notifications"
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.glassBorder,
            backgroundColor: colors.glassStrong,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="notifications-outline" size={18} color={colors.ink} />
        </Pressable>
        <Pressable
          onPress={() => router.push("/(app)/profile")}
          hitSlop={8}
          accessibilityLabel="Open profile"
        >
          <AvatarInitials name={user?.name} size={40} ring />
        </Pressable>
      </View>
    </View>
  );
}
