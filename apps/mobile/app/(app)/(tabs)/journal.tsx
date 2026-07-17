import { useMemo, useState } from "react";
import {
  Text,
  View,
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Screen } from "@/src/components/Screen";
import { GlassCard } from "@/src/components/GlassCard";
import { AppHeader } from "@/src/components/AppHeader";
import { deleteJournal, listJournals, type JournalEntry } from "@/src/api/journals.api";
import { getErrorMessage } from "@/src/api/client";
import { colors } from "@/src/theme/colors";
import { tabBarClearance } from "@/src/constants/tabBar";

type Filter = "all" | "prompt" | "free";

function EntryIcon({ entry }: { entry: JournalEntry }) {
  const isFree = entry.isFreeWrite;
  return (
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: isFree ? "rgba(0,207,238,0.25)" : "rgba(196,229,98,0.25)",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons
        name={isFree ? "document-text" : "create"}
        size={20}
        color={isFree ? colors.secondary : colors.primary}
      />
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: active ? colors.primary : colors.glassStrong,
        borderWidth: 1,
        borderColor: active ? colors.primary : colors.glassBorder,
        marginRight: 8,
      }}
    >
      <Text
        className="font-sansMedium text-sm"
        style={{ color: active ? colors.night : colors.ink }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function JournalListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [menuId, setMenuId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["journals"], queryFn: listJournals });

  const remove = useMutation({
    mutationFn: deleteJournal,
    onSuccess: () => {
      setMenuId(null);
      qc.invalidateQueries({ queryKey: ["journals"] });
    },
    onError: (e) => Alert.alert("Couldn’t delete", getErrorMessage(e)),
  });

  const filtered = useMemo(() => {
    let list = data || [];
    if (filter === "prompt") list = list.filter((e) => !e.isFreeWrite);
    if (filter === "free") list = list.filter((e) => e.isFreeWrite);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (e) =>
          e.body.toLowerCase().includes(q) ||
          (e.mood?.label || "").toLowerCase().includes(q) ||
          (e.prompt?.text || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [data, filter, query]);

  function onDelete(id: string) {
    Alert.alert("Delete entry?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => remove.mutate(id) },
    ]);
  }

  const chips = (
    <>
      <Chip label="All" active={filter === "all"} onPress={() => setFilter("all")} />
      <Chip label="Prompt" active={filter === "prompt"} onPress={() => setFilter("prompt")} />
      <Chip label="Free-write" active={filter === "free"} onPress={() => setFilter("free")} />
    </>
  );

  return (
    <Screen ambient="subtle">
      <View style={{ paddingBottom: tabBarClearance(insets.bottom) }}>
        <AppHeader showBrand={false} title="My Journal" />

        <View
          className="flex-row items-center mb-4 rounded-2xl px-3"
          style={{
            backgroundColor: colors.glassStrong,
            borderWidth: 1,
            borderColor: colors.glassBorder,
            minHeight: 48,
          }}
        >
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search your journal entries…"
            placeholderTextColor="rgba(254,254,254,0.35)"
            className="flex-1 font-sans text-base ml-2 py-3"
            style={{ color: colors.ink }}
          />
          {query ? (
            <Pressable onPress={() => setQuery("")} hitSlop={10}>
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>

        {width < 360 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-5"
            contentContainerStyle={{ paddingRight: 8 }}
          >
            {chips}
          </ScrollView>
        ) : (
          <View className="flex-row mb-5">{chips}</View>
        )}

        {isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : !filtered.length ? (
          <GlassCard>
            <Text className="font-sansMedium mb-2" style={{ color: colors.ink }}>
              {data?.length ? "No matches" : "No entries yet"}
            </Text>
            <Text className="font-sans" style={{ color: colors.muted }}>
              {data?.length
                ? "Try another search or filter."
                : "Start with today’s prompt or a free write from Home."}
            </Text>
          </GlassCard>
        ) : (
          filtered.map((entry, index) => {
            const openUp = index >= filtered.length - 2;
            return (
            <View key={entry.id} className="mb-3" style={{ position: "relative", zIndex: menuId === entry.id ? 2 : 1 }}>
              <Pressable onPress={() => router.push(`/(app)/entry/${entry.id}`)}>
                <GlassCard>
                  <View className="flex-row items-center">
                    <EntryIcon entry={entry} />
                    <View className="flex-1 ml-3 mr-2">
                      <Text className="font-sansMedium" numberOfLines={1} style={{ color: colors.ink }}>
                        {entry.isFreeWrite ? "Free-write" : "Prompt journal"}
                        {entry.mood ? ` · ${entry.mood.label}` : ""}
                      </Text>
                      <Text className="font-sans text-xs mt-1" style={{ color: colors.muted }}>
                        {new Date(entry.createdAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                      <Text className="font-sans text-sm mt-1.5" numberOfLines={1} style={{ color: colors.muted }}>
                        {entry.body}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => setMenuId((id) => (id === entry.id ? null : entry.id))}
                      hitSlop={12}
                      className="min-h-[44px] min-w-[44px] items-center justify-center"
                    >
                      <Ionicons name="ellipsis-vertical" size={18} color={colors.muted} />
                    </Pressable>
                  </View>
                </GlassCard>
              </Pressable>

              {menuId === entry.id ? (
                <View
                  style={{
                    position: "absolute",
                    right: 12,
                    ...(openUp ? { bottom: 52 } : { top: 52 }),
                    backgroundColor: "rgba(1,18,47,0.96)",
                    borderWidth: 1,
                    borderColor: colors.glassBorder,
                    borderRadius: 16,
                    paddingVertical: 6,
                    minWidth: 140,
                    zIndex: 10,
                    elevation: 8,
                  }}
                >
                  <Pressable
                    onPress={() => {
                      setMenuId(null);
                      router.push(`/(app)/entry/${entry.id}`);
                    }}
                    className="flex-row items-center px-4 py-3"
                  >
                    <Ionicons name="eye-outline" size={16} color={colors.ink} />
                    <Text className="font-sans ml-2" style={{ color: colors.ink }}>
                      Open
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => onDelete(entry.id)}
                    className="flex-row items-center px-4 py-3"
                  >
                    <Ionicons name="trash-outline" size={16} color="#FF8A8A" />
                    <Text className="font-sans ml-2" style={{ color: "#FF8A8A" }}>
                      Delete
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
            );
          })
        )}
      </View>
    </Screen>
  );
}
