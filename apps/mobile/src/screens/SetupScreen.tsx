import React, { useState } from "react";
import {
  Button,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAvoidingWrapper } from "../components/KeyboardAvoidingWrapper";
import { setStoredToken } from "../store/token";
import { apiRequest } from "../api/client";

type SetupScreenProps = { onDone: () => void; navigation?: { navigate: (name: string) => void } };

export function SetupScreen({ onDone, navigation }: SetupScreenProps) {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const t = token.trim();
    if (!t) {
      setError("Enter family token");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await apiRequest("/babies", { method: "GET", token: t });
      if (res.status === 401) {
        setError("Invalid token");
        return;
      }
      if (!res.ok) {
        setError("Network error");
        return;
      }
      await setStoredToken(t);
      onDone();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingWrapper style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>Setup</Text>
        <Text style={styles.helper}>Paste your family token to sync data.</Text>
        <TextInput
          style={styles.input}
          placeholder="Family token"
          value={token}
          onChangeText={setToken}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title={loading ? "Checking…" : "Save"} onPress={handleSave} disabled={loading} />
        {navigation ? (
          <Button title="Create new family" onPress={() => navigation.navigate("CreateFamily")} />
        ) : null}
      </View>
    </KeyboardAvoidingWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24 },
  inner: { gap: 12 },
  title: { fontSize: 24, fontWeight: "600" },
  helper: { fontSize: 14, color: "#666" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  error: { color: "#c00", fontSize: 14 },
});
