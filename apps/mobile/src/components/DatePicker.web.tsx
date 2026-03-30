import React, { useRef, useCallback } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { colors, borderRadius, spacing } from "../theme";
import type { DatePickerProps } from "./DatePicker";

function formatDateYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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
  const inputRef = useRef<HTMLInputElement>(null);
  const inputType = mode === "datetime" ? "datetime-local" : "date";

  const handlePress = useCallback(() => {
    inputRef.current?.showPicker?.();
    inputRef.current?.focus();
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.value) return;
      if (mode === "datetime") {
        onChange(new Date(e.target.value).toISOString());
      } else {
        onChange(e.target.value);
      }
    },
    [onChange, mode],
  );

  const displayValue = value && mode === "datetime"
    ? new Date(value).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : value;

  return (
    <Pressable
      style={styles.container}
      onPress={handlePress}
      testID={testID}
    >
      <Text style={[styles.text, !value && styles.placeholder]}>
        {displayValue || placeholder}
      </Text>
      <input
        ref={inputRef}
        type={inputType}
        value={mode === "datetime" && value ? value.slice(0, 16) : value}
        max={maximumDate ? formatDateYYYYMMDD(maximumDate) : undefined}
        min={minimumDate ? formatDateYYYYMMDD(minimumDate) : undefined}
        onChange={handleChange}
        tabIndex={-1}
        style={{
          position: "absolute",
          opacity: 0,
          width: 0,
          height: 0,
          pointerEvents: "none",
        }}
      />
    </Pressable>
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
});
