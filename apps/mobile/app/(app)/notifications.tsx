import { Pressable, Text, View } from "react-native";
import { type Href, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Screen } from "@/src/components/Screen";
import { GlassCard } from "@/src/components/GlassCard";
import { Button } from "@/src/components/Button";
import {
  selectUnreadCount,
  useNotificationsStore,
} from "@/src/store/notifications";
import { formatInboxTime, kindIcon, sortInbox } from "@/src/notifications/format";
import type { InboxNotification } from "@/src/notifications/types";
import { colors } from "@/src/theme/colors";
import { type } from "@/src/theme/typography";
import { toast } from "@/src/lib/toast";

function InboxRow({
  item,
  onOpen,
}: {
  item: InboxNotification;
  onOpen: (item: InboxNotification) => void;
}) {
  const unread = !item.readAt;

  return (
    <Pressable
      onPress={() => onOpen(item)}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}. ${item.body}`}
      style={{ marginBottom: 12 }}
    >
      <GlassCard>
        <View className="flex-row gap-3">
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: unread ? colors.primaryGlowSoft : colors.glass,
              borderWidth: 1,
              borderColor: colors.glassBorder,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name={kindIcon(item.kind)}
              size={18}
              color={unread ? colors.primary : colors.muted}
            />
          </View>

          <View className="flex-1">
            <View className="flex-row items-center justify-between gap-2 mb-1">
              <Text
                className="font-sansMedium flex-1"
                numberOfLines={1}
                style={{
                  color: colors.ink,
                  fontSize: type.bodySm.fontSize,
                  lineHeight: type.bodySm.lineHeight,
                }}
              >
                {item.title}
              </Text>
              <Text
                style={{
                  color: colors.muted,
                  fontFamily: "DMSans_400Regular",
                  fontSize: 11,
                  lineHeight: 14,
                }}
              >
                {formatInboxTime(item.createdAt)}
              </Text>
            </View>
            <Text
              numberOfLines={3}
              style={{
                color: unread ? colors.ink : colors.muted,
                fontFamily: "DMSans_400Regular",
                fontSize: type.bodySm.fontSize,
                lineHeight: type.bodySm.lineHeight,
                opacity: unread ? 1 : 0.85,
              }}
            >
              {item.body}
            </Text>
            {unread ? (
              <View
                style={{
                  marginTop: 10,
                  alignSelf: "flex-start",
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 999,
                  backgroundColor: colors.primaryGlowSoft,
                }}
              >
                <Text
                  style={{
                    color: colors.primary,
                    fontFamily: "DMSans_500Medium",
                    fontSize: 10,
                    letterSpacing: 0.6,
                    textTransform: "uppercase",
                  }}
                >
                  New
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </GlassCard>
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const items = useNotificationsStore((s) => s.items);
  const unread = useNotificationsStore(selectUnreadCount);
  const sorted = sortInbox(items);
  const markRead = useNotificationsStore((s) => s.markRead);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);

  async function onOpen(item: InboxNotification) {
    await markRead(item.id);
    if (item.href) {
      router.push(item.href as Href);
      return;
    }
    toast.info(item.title);
  }

  async function onMarkAll() {
    await markAllRead();
    toast.success("All caught up");
  }

  return (
    <Screen scroll edges={["top", "left", "right", "bottom"]}>
      <View style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        <Pressable
          onPress={() => router.back()}
          className="mb-4 min-h-[44px] justify-center"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text className="font-sansMedium" style={{ color: colors.secondary }}>
            ← Back
          </Text>
        </Pressable>

        <View className="flex-row items-end justify-between mb-2 gap-3">
          <Text
            className="font-display flex-1"
            style={{
              color: colors.ink,
              fontSize: type.greeting.fontSize,
              lineHeight: type.greeting.lineHeight,
            }}
          >
            Notifications
          </Text>
          {unread > 0 ? (
            <Pressable onPress={onMarkAll} hitSlop={8} accessibilityRole="button">
              <Text className="font-sansMedium" style={{ color: colors.secondary, marginBottom: 6 }}>
                Mark all read
              </Text>
            </Pressable>
          ) : null}
        </View>

        <Text
          className="font-sans mb-5"
          style={{
            color: colors.muted,
            fontSize: type.bodySm.fontSize,
            lineHeight: type.bodySm.lineHeight,
          }}
        >
          Insights, gentle nudges, and updates — saved on this device.
        </Text>

        {sorted.length === 0 ? (
          <GlassCard>
            <Text className="font-sansMedium mb-2" style={{ color: colors.ink }}>
              You’re all clear
            </Text>
            <Text className="font-sans mb-4" style={{ color: colors.muted }}>
              When a weekly insight is ready or it’s a good day to write, it’ll show up here.
            </Text>
            <Button title="Back to home" onPress={() => router.back()} />
          </GlassCard>
        ) : (
          sorted.map((item) => <InboxRow key={item.id} item={item} onOpen={onOpen} />)
        )}
      </View>
    </Screen>
  );
}
