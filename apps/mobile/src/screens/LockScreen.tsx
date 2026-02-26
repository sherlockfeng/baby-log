import React, { useEffect } from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { useAppLock } from "../context/AppLock";

export function LockScreen() {
  const { unlock } = useAppLock();

  const handleUnlock = async () => {
    await unlock();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BabyLog</Text>
      <Text style={styles.subtitle}>Tap to unlock</Text>
      <Button title="Unlock" onPress={handleUnlock} />
    </View>
  );
}
