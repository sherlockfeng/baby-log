import React, { useState, useCallback } from "react";
import { Pressable, StyleSheet, Text, Platform } from "react-native";
import RNDateTimePicker from "@react-native-community/datetimepicker";
import { colors, borderRadius, spacing } from "../theme";
import type { DatePickerProps } from "./DatePicker";

function formatDateYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseToDate(value: string, isDatetime: boolean): Date {
  if (!value) return new Date();
  if (isDatetime) {
    const d = new Date(value);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(value + "T12:00:00");
  }
  return new Date();
}

export function DatePicker({
  value,
  onChange,
  maximumDate,
  minimumDate,
  placeholder = "选择日期",
  testID,
  mode = "date",
}: DatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const isDatetime = mode === "datetime";

  const handleChange = useCallback(
    (event: { type: string }, date?: Date) => {
      if (Platform.OS === "android") setShowPicker(false);
      if (event.type === "set" && date != null) {
        onChange(isDatetime ? date.toISOString() : formatDateYYYYMMDD(date));
      }
    },
    [onChange, isDatetime],
  );

  const handleDone = useCallback(() => setShowPicker(false), []);

  const displayValue = value && isDatetime
    ? new Date(value).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : value;

  return (
    <>
      <Pressable
        style={styles.container}
        onPress={() => setShowPicker(true)}
        testID={testID}
      >
        <Text style={[styles.text, !value && styles.placeholder]}>
          {displayValue || placeholder}
        </Text>
      </Pressable>
      {showPicker && (
        <>
          <RNDateTimePicker
            value={parseToDate(value, isDatetime)}
            mode={isDatetime ? "datetime" : "date"}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleChange}
            maximumDate={maximumDate}
            minimumDate={minimumDate}
          />
          {Platform.OS === "ios" && (
            <Pressable style={styles.doneButton} onPress={handleDone}>
              <Text style={styles.doneButtonText}>完成</Text>
            </Pressable>
          )}
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.input,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.card,
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  text: {
    fontSize: 16,
    color: colors.text,
  },
  placeholder: {
    color: colors.placeholder,
  },
  doneButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: borderRadius.button,
    alignItems: "center" as const,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  doneButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
