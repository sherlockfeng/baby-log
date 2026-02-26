import React, { useState } from "react";
import {
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getStoredToken } from "../store/token";
import { apiJson } from "../api/client";
import type { Baby, EventType } from "@babylog/shared-types";

const EVENT_TYPES: { type: EventType; label: string }[] = [
  { type: "feed" as EventType, label: "Feed" },
  { type: "poop" as EventType, label: "Poop" },
  { type: "weight" as EventType, label: "Weight" },
  { type: "vaccine" as EventType, label: "Vaccine" },
  { type: "sleep" as EventType, label: "Sleep" },
  { type: "diaper" as EventType, label: "Diaper" },
  { type: "solid" as EventType, label: "Solid" },
];

function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function QuickAddScreen() {
  const queryClient = useQueryClient();
  const { data: token } = useQuery({ queryKey: ["token"], queryFn: getStoredToken });
  const { data: babies } = useQuery({
    queryKey: ["babies", token],
    queryFn: () => apiJson<Baby[]>("/babies", { token: token ?? undefined }),
    enabled: !!token,
  });
  const [selectedType, setSelectedType] = useState<EventType | null>(null);
  const [babyId, setBabyId] = useState("");
  const [amountMl, setAmountMl] = useState("");
  const [method, setMethod] = useState<"breast" | "bottle" | "mixed">("bottle");
  const [note, setNote] = useState("");
  const [kg, setKg] = useState("");
  const [vaccineName, setVaccineName] = useState("");
  const [sleepStart, setSleepStart] = useState("");
  const [sleepEnd, setSleepEnd] = useState("");
  const [diaperKind, setDiaperKind] = useState<"wet" | "dirty" | "both">("wet");
  const [food, setFood] = useState("");
  const [poopKind, setPoopKind] = useState("normal");

  const createEvent = useMutation({
    mutationFn: async (body: unknown) => {
      return apiJson("/events", { method: "POST", token: token ?? undefined, body });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setSelectedType(null);
    },
  });

  const submitFeed = () => {
    if (!babyId || !token) return;
    createEvent.mutate({
      id: uuid(),
      babyId,
      eventType: "feed",
      eventTime: new Date().toISOString(),
      payload: {
        amountMl: amountMl ? parseInt(amountMl, 10) : undefined,
        method,
        note: note || undefined,
      },
    });
  };

  const submitPoop = () => {
    if (!babyId || !token) return;
    createEvent.mutate({
      id: uuid(),
      babyId,
      eventType: "poop",
      eventTime: new Date().toISOString(),
      payload: { kind: poopKind as "normal" | "loose" | "hard" | "watery", note: note || undefined },
    });
  };

  const submitWeight = () => {
    if (!babyId || !token || !kg) return;
    createEvent.mutate({
      id: uuid(),
      babyId,
      eventType: "weight",
      eventTime: new Date().toISOString(),
      payload: { kg: parseFloat(kg), note: note || undefined },
    });
  };

  const submitVaccine = () => {
    if (!babyId || !token || !vaccineName) return;
    createEvent.mutate({
      id: uuid(),
      babyId,
      eventType: "vaccine",
      eventTime: new Date().toISOString(),
      payload: { name: vaccineName, note: note || undefined },
    });
  };

  const submitSleep = () => {
    if (!babyId || !token || !sleepStart || !sleepEnd) return;
    createEvent.mutate({
      id: uuid(),
      babyId,
      eventType: "sleep",
      eventTime: new Date().toISOString(),
      payload: { startTime: sleepStart, endTime: sleepEnd, note: note || undefined },
    });
  };

  const submitDiaper = () => {
    if (!babyId || !token) return;
    createEvent.mutate({
      id: uuid(),
      babyId,
      eventType: "diaper",
      eventTime: new Date().toISOString(),
      payload: { kind: diaperKind, note: note || undefined },
    });
  };

  const submitSolid = () => {
    if (!babyId || !token || !food) return;
    createEvent.mutate({
      id: uuid(),
      babyId,
      eventType: "solid",
      eventTime: new Date().toISOString(),
      payload: { food, note: note || undefined },
    });
  };

  if (!token) {
    return <Text style={styles.msg}>Setup token first.</Text>;
  }

  if (!babies?.length) {
    return <Text style={styles.msg}>Add a baby first (e.g. from Settings).</Text>;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Quick Add</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Baby</Text>
        <View style={styles.buttonRow}>
          {babies.map((b) => (
            <Button
              key={b.id}
              title={b.name}
              onPress={() => setBabyId(b.id)}
              color={babyId === b.id ? "#007AFF" : "#999"}
            />
          ))}
        </View>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Type</Text>
        <View style={styles.buttonRow}>
          {EVENT_TYPES.map(({ type, label }) => (
            <Button
              key={type}
              title={label}
              onPress={() => setSelectedType(type)}
              color={selectedType === type ? "#007AFF" : "#999"}
            />
          ))}
        </View>
      </View>
      {selectedType === "feed" && (
        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="Amount (ml)" value={amountMl} onChangeText={setAmountMl} keyboardType="number-pad" />
          <View style={styles.buttonRow}>
            {(["bottle", "breast", "mixed"] as const).map((m) => (
              <Button key={m} title={m} onPress={() => setMethod(m)} color={method === m ? "#007AFF" : "#999"} />
            ))}
          </View>
          <TextInput style={styles.input} placeholder="Note" value={note} onChangeText={setNote} />
          <Button title="Add Feed" onPress={submitFeed} disabled={createEvent.isPending} />
        </View>
      )}
      {selectedType === "poop" && (
        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="Kind (normal/loose/hard/watery)" value={poopKind} onChangeText={setPoopKind} />
          <TextInput style={styles.input} placeholder="Note" value={note} onChangeText={setNote} />
          <Button title="Add Poop" onPress={submitPoop} disabled={createEvent.isPending} />
        </View>
      )}
      {selectedType === "weight" && (
        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="Weight (kg)" value={kg} onChangeText={setKg} keyboardType="decimal-pad" />
          <TextInput style={styles.input} placeholder="Note" value={note} onChangeText={setNote} />
          <Button title="Add Weight" onPress={submitWeight} disabled={createEvent.isPending} />
        </View>
      )}
      {selectedType === "vaccine" && (
        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="Vaccine name" value={vaccineName} onChangeText={setVaccineName} />
          <TextInput style={styles.input} placeholder="Note" value={note} onChangeText={setNote} />
          <Button title="Add Vaccine" onPress={submitVaccine} disabled={createEvent.isPending} />
        </View>
      )}
      {selectedType === "sleep" && (
        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="Start (ISO)" value={sleepStart} onChangeText={setSleepStart} />
          <TextInput style={styles.input} placeholder="End (ISO)" value={sleepEnd} onChangeText={setSleepEnd} />
          <TextInput style={styles.input} placeholder="Note" value={note} onChangeText={setNote} />
          <Button title="Add Sleep" onPress={submitSleep} disabled={createEvent.isPending} />
        </View>
      )}
      {selectedType === "diaper" && (
        <View style={styles.form}>
          <View style={styles.buttonRow}>
            {(["wet", "dirty", "both"] as const).map((k) => (
              <Button key={k} title={k} onPress={() => setDiaperKind(k)} color={diaperKind === k ? "#007AFF" : "#999"} />
            ))}
          </View>
          <TextInput style={styles.input} placeholder="Note" value={note} onChangeText={setNote} />
          <Button title="Add Diaper" onPress={submitDiaper} disabled={createEvent.isPending} />
        </View>
      )}
      {selectedType === "solid" && (
        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="Food" value={food} onChangeText={setFood} />
          <TextInput style={styles.input} placeholder="Note" value={note} onChangeText={setNote} />
          <Button title="Add Solid" onPress={submitSolid} disabled={createEvent.isPending} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 24, fontWeight: "600", padding: 16 },
  row: { padding: 16 },
  label: { fontSize: 14, marginBottom: 8 },
  buttonRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  form: { padding: 16, gap: 12 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, fontSize: 16 },
  msg: { padding: 24, textAlign: "center" },
});
