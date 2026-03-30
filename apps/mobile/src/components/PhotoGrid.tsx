import React, { useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  View,
  FlatList,
  Dimensions,
  Text,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, spacing, borderRadius } from "../theme";
import { API_BASE_URL } from "../config";
import { TID } from "../testids";

function resolvePhotoUrl(url: string): string {
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return `${API_BASE_URL}${url}`;
  return url;
}

interface Props {
  photos: string[];
  testID?: string;
}

const SCREEN_WIDTH = Dimensions.get("window").width;
const THUMB_SIZE = (SCREEN_WIDTH - spacing.lg * 2 - spacing.xs * 2) / 3;

export function PhotoGrid({ photos, testID }: Props) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  if (photos.length === 0) return null;

  return (
    <>
      <View style={styles.grid} testID={testID}>
        {photos.map((url, idx) => (
          <Pressable
            key={idx}
            onPress={() => setViewerIndex(idx)}
            testID={TID.photo.thumb(idx)}
          >
            <Image source={{ uri: resolvePhotoUrl(url) }} style={styles.thumb} />
          </Pressable>
        ))}
      </View>

      <Modal visible={viewerIndex !== null} transparent animationType="fade" testID={TID.photo.viewer}>
        <View style={styles.viewerBg}>
          <Pressable style={styles.closeBtn} onPress={() => setViewerIndex(null)} testID={TID.photo.closeButton}>
            <MaterialIcons name="close" size={28} color="#FFFFFF" />
          </Pressable>
          {viewerIndex !== null && (
            <FlatList
              data={photos}
              horizontal
              pagingEnabled
              initialScrollIndex={viewerIndex}
              getItemLayout={(_, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: resolvePhotoUrl(item) }}
                  style={styles.fullImage}
                  resizeMode="contain"
                />
              )}
            />
          )}
          <Text style={styles.counter}>
            {viewerIndex !== null ? `${viewerIndex + 1} / ${photos.length}` : ""}
          </Text>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.xs },
  thumb: { width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: borderRadius.input, backgroundColor: colors.backgroundSecondary },
  viewerBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)", justifyContent: "center" },
  closeBtn: { position: "absolute", top: 50, right: 20, zIndex: 10, padding: 8 },
  fullImage: { width: SCREEN_WIDTH, height: SCREEN_WIDTH },
  counter: { color: "#FFFFFF", textAlign: "center", fontSize: 14, paddingVertical: spacing.md },
});
