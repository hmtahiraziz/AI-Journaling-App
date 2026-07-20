import { Pressable, Text, View } from "react-native";
import { type Href, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  selectUnreadCount,
  useNotificationsStore,
} from "@/src/store/notifications";
import { colors } from "@/src/theme/colors";

const NOTIFICATIONS_HREF = "/(app)/notifications" as Href;

type Props = {
  /** Hide on screens that shouldn’t jump to the inbox chrome. */
  visible?: boolean;
};

export function NotificationBell({ visible = true }: Props) {
  const router = useRouter();
  const unread = useNotificationsStore(selectUnreadCount);

  if (!visible) return null;

  const label =
    unread > 0
      ? `Notifications, ${unread} unread`
      : "Notifications";

  return (
    <Pressable
      onPress={() => router.push(NOTIFICATIONS_HREF)}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
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
      {unread > 0 ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 6,
            right: 7,
            minWidth: 16,
            height: 16,
            paddingHorizontal: 4,
            borderRadius: 8,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              color: colors.night,
              fontFamily: "DMSans_700Bold",
              fontSize: 9,
              lineHeight: 11,
            }}
          >
            {unread > 9 ? "9+" : String(unread)}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}
