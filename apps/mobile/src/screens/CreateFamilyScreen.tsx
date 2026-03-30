import React, { useState } from "react";
import {
  Alert,
  Button,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAvoidingWrapper } from "../components/KeyboardAvoidingWrapper";
import { apiJson } from "../api/client";
import { setStoredToken } from "../store/token";

export function CreateFamilyScreen({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<{ familyId: string; token: string } | null>(null);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const data = await apiJson<{ familyId: string; token: string }>("/families", {
        method: "POST",
        body: { name: name.trim() || undefined },
      });
      setCreated(data);
      await setStoredToken(data.token);
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (created) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Family created</Text>
        <Text style={styles.warning}>Save this token. It won’t be shown again.</Text>
        <Text style={styles.token} selectable>{created.token}</Text>
        <Button title="Continue" onPress={onDone} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingWrapper style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>Create family</Text>
        <TextInput
          style={styles.input}
          placeholder="Family name (optional)"
          value={name}
          onChangeText={setName}
          editable={!loading}
        />
        <Button title={loading ? "Creating…" : "Create"} onPress={handleCreate} disabled={loading} />
      </View>
    </KeyboardAvoidingWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24 },
  inner: { gap: 12 },
  title: { fontSize: 24, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  warning: { color: "#c00", marginVertical: 8 },
  token: { fontFamily: "monospace", fontSize: 12, marginVertical: 8, padding: 8, backgroundColor: "#f5f5f5" },
});
