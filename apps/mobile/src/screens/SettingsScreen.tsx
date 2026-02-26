import React, { useState } from "react";
import {
  Alert,
  Button,
  Switch,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getStoredToken } from "../store/token";
import { getFaceIdEnabled, setFaceIdEnabled } from "../store/settings";
import { apiJson, apiRequest } from "../api/client";
import type { Baby } from "@babylog/shared-types";

export function SettingsScreen({ onLogout }: { onLogout: () => void }) {
  const queryClient = useQueryClient();
  const { data: token } = useQuery({ queryKey: ["token"], queryFn: getStoredToken });
  const { data: faceIdEnabled, refetch: refetchFaceId } = useQuery({
    queryKey: ["faceIdEnabled"],
    queryFn: getFaceIdEnabled,
  });
  const [faceIdToggle, setFaceIdToggle] = useState(!!faceIdEnabled);
  const [newBabyName, setNewBabyName] = useState("");
  const [newBabyBirth, setNewBabyBirth] = useState("");

  React.useEffect(() => {
    if (faceIdEnabled !== undefined) setFaceIdToggle(faceIdEnabled);
  }, [faceIdEnabled]);

  const setFaceId = useMutation({
    mutationFn: setFaceIdEnabled,
    onSuccess: () => {
      refetchFaceId();
      queryClient.invalidateQueries({ queryKey: ["faceIdEnabled"] });
    },
  });

  const createBaby = useMutation({
    mutationFn: async (body: { name: string; birthDate: string }) =>
      apiJson<Baby>("/babies", { method: "POST", token: token ?? undefined, body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["babies"] });
      setNewBabyName("");
      setNewBabyBirth("");
    },
  });

  const handleLogout = () => onLogout();

  const handleFaceIdToggle = (value: boolean) => {
    setFaceIdToggle(value);
    setFaceId.mutate(value);
  };

  const handleAddBaby = () => {
    if (!newBabyName.trim()) {
      Alert.alert("Error", "Name required");
      return;
    }
    const birth = newBabyBirth.trim() || new Date().toISOString().slice(0, 10);
    createBaby.mutate({ name: newBabyName.trim(), birthDate: birth });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Lock</Text>
        <View style={styles.row}>
          <Text>FaceID / TouchID</Text>
          <Switch value={faceIdToggle} onValueChange={handleFaceIdToggle} />
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Add baby</Text>
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={newBabyName}
          onChangeText={setNewBabyName}
        />
        <TextInput
          style={styles.input}
          placeholder="Birth date (YYYY-MM-DD)"
          value={newBabyBirth}
          onChangeText={setNewBabyBirth}
        />
        <Button
          title={createBaby.isPending ? "Adding…" : "Add baby"}
          onPress={handleAddBaby}
          disabled={createBaby.isPending}
        />
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Token</Text>
        <Text style={styles.tokenStatus}>{token ? "Token saved" : "No token"}</Text>
        <Button title="Logout / Setup again" onPress={handleLogout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: "600" },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  tokenStatus: { marginBottom: 8 },
});
