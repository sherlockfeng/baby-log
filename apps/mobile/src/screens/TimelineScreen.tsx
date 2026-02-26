import React, { useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { getStoredToken } from "../store/token";
import { apiJson } from "../api/client";
import type { Baby, Event } from "@babylog/shared-types";

export function TimelineScreen() {
  const [babyId, setBabyId] = useState<string | undefined>();
  const { data: token } = useQuery({ queryKey: ["token"], queryFn: getStoredToken });
  const { data: babies } = useQuery({
    queryKey: ["babies", token],
    queryFn: () => apiJson<Baby[]>("/babies", { token: token ?? undefined }),
    enabled: !!token,
  });
  const { data: list, isLoading } = useQuery({
    queryKey: ["events", token, babyId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (babyId) params.set("babyId", babyId);
      params.set("limit", "50");
      return apiJson<{ events: Event[] }>(`/events?${params}`, { token: token ?? undefined });
    },
    enabled: !!token,
  });

  if (!token) return <Text style={styles.msg}>Setup token first.</Text>;

  const events = list?.events ?? [];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Timeline</Text>
      {babies && babies.length > 0 && (
        <View style={styles.filterRow}>
          <Text style={styles.label}>Baby: </Text>
          <View style={styles.buttonRow}>
            <Text style={styles.filterBtn} onPress={() => setBabyId(undefined)}>All</Text>
            {babies.map((b) => (
              <Text key={b.id} style={styles.filterBtn} onPress={() => setBabyId(b.id)}>{b.name}</Text>
            ))}
          </View>
        </View>
      )}
      {isLoading ? (
        <Text style={styles.msg}>Loading…</Text>
      ) : events.length === 0 ? (
        <Text style={styles.msg}>No events yet.</Text>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.event}>
              <Text style={styles.eventType}>{item.eventType}</Text>
              <Text style={styles.eventTime}>{new Date(item.eventTime).toLocaleString()}</Text>
              {item.payload && typeof item.payload === "object" && (
                <Text style={styles.payload}>{JSON.stringify(item.payload)}</Text>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 16 },
  title: { fontSize: 24, fontWeight: "600", paddingHorizontal: 16 },
  filterRow: { flexDirection: "row", alignItems: "center", padding: 16 },
  label: { marginRight: 8 },
  buttonRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filterBtn: { color: "#007AFF", padding: 4 },
  event: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#eee" },
  eventType: { fontWeight: "600" },
  eventTime: { fontSize: 12, color: "#666" },
  payload: { fontSize: 12, marginTop: 4 },
  msg: { padding: 24, textAlign: "center" },
});
