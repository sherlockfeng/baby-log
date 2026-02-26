import React from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { getStoredToken } from "../store/token";
import { apiJson } from "../api/client";
import type { Baby } from "@babylog/shared-types";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

export type RootStackParamList = {
  Home: undefined;
  QuickAdd: undefined;
  Timeline: undefined;
  Settings: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export function HomeScreen({ navigation }: Props) {
  const { data: token } = useQuery({ queryKey: ["token"], queryFn: getStoredToken });
  const { data: babies, isLoading } = useQuery({
    queryKey: ["babies", token],
    queryFn: () => apiJson<Baby[]>("/babies", { token: token ?? undefined }),
    enabled: !!token,
  });

  if (!token) return <Text style={styles.msg}>No token. Go to Setup.</Text>;
  if (isLoading) return <Text style={styles.msg}>Loading…</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Today</Text>
      <Text style={styles.subtitle}>
        {babies?.length ? `Babies: ${babies.map((b) => b.name).join(", ")}` : "No babies yet. Add one in Settings."}
      </Text>
      <View style={styles.buttons}>
        <Button title="Quick Add" onPress={() => navigation.navigate("QuickAdd")} />
        <Button title="Timeline" onPress={() => navigation.navigate("Timeline")} />
        <Button title="Settings" onPress={() => navigation.navigate("Settings")} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: "600" },
  subtitle: { fontSize: 14, color: "#666", marginTop: 8 },
  buttons: { marginTop: 24, gap: 12 },
  msg: { flex: 1, textAlign: "center", marginTop: 48 },
});
