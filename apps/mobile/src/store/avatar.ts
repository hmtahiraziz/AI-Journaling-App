import { create } from "zustand";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { Alert, Platform } from "react-native";

const AVATAR_DIR = `${FileSystem.documentDirectory}avatars/`;

function avatarPath(userId: string) {
  return `${AVATAR_DIR}${userId}.jpg`;
}

type AvatarState = {
  /** Local file URI for the current user’s avatar */
  uri: string | null;
  ready: boolean;
  hydrate: (userId: string | null | undefined) => Promise<void>;
  pickAndSave: (userId: string) => Promise<boolean>;
  remove: (userId: string) => Promise<void>;
  clear: () => void;
};

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(AVATAR_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(AVATAR_DIR, { intermediates: true });
  }
}

export const useAvatarStore = create<AvatarState>((set) => ({
  uri: null,
  ready: false,

  hydrate: async (userId) => {
    if (!userId) {
      set({ uri: null, ready: true });
      return;
    }
    try {
      const path = avatarPath(userId);
      const info = await FileSystem.getInfoAsync(path);
      set({ uri: info.exists ? path : null, ready: true });
    } catch {
      set({ uri: null, ready: true });
    }
  },

  pickAndSave: async (userId) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        "Allow photo access to set your profile picture."
      );
      return false;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return false;

    try {
      await ensureDir();
      const dest = avatarPath(userId);
      await FileSystem.copyAsync({ from: result.assets[0].uri, to: dest });
      // cache-bust so Image reloads
      const stamped = `${dest}?t=${Date.now()}`;
      set({ uri: stamped });
      return true;
    } catch (e) {
      console.warn(e);
      Alert.alert("Couldn’t save photo", "Please try another image.");
      return false;
    }
  },

  remove: async (userId) => {
    try {
      const path = avatarPath(userId);
      const info = await FileSystem.getInfoAsync(path);
      if (info.exists) await FileSystem.deleteAsync(path, { idempotent: true });
    } catch {
      /* ignore */
    }
    set({ uri: null });
  },

  clear: () => set({ uri: null, ready: false }),
}));

export async function pickFromCamera(userId: string): Promise<boolean> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    Alert.alert("Permission needed", "Allow camera access to take a profile photo.");
    return false;
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });

  if (result.canceled || !result.assets?.[0]?.uri) return false;

  try {
    await ensureDir();
    const dest = avatarPath(userId);
    await FileSystem.copyAsync({ from: result.assets[0].uri, to: dest });
    useAvatarStore.setState({ uri: `${dest}?t=${Date.now()}` });
    return true;
  } catch {
    Alert.alert("Couldn’t save photo", "Please try again.");
    return false;
  }
}

export function showAvatarPicker(userId: string, onDone?: () => void) {
  const buttons: {
    text: string;
    style?: "cancel" | "destructive" | "default";
    onPress?: () => void;
  }[] = [
    {
      text: "Photo library",
      onPress: async () => {
        const ok = await useAvatarStore.getState().pickAndSave(userId);
        if (ok) onDone?.();
      },
    },
  ];

  if (Platform.OS !== "web") {
    buttons.push({
      text: "Take photo",
      onPress: async () => {
        const ok = await pickFromCamera(userId);
        if (ok) onDone?.();
      },
    });
  }

  if (useAvatarStore.getState().uri) {
    buttons.push({
      text: "Remove photo",
      style: "destructive",
      onPress: async () => {
        await useAvatarStore.getState().remove(userId);
        onDone?.();
      },
    });
  }

  buttons.push({ text: "Cancel", style: "cancel" });

  Alert.alert("Profile photo", "Choose how you’d like to update your photo.", buttons);
}
