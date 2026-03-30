import React from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import type { KeyboardAvoidingWrapperProps } from "./KeyboardAvoidingWrapper";

export function KeyboardAvoidingWrapper({ style, children }: KeyboardAvoidingWrapperProps) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={style}
    >
      {children}
    </KeyboardAvoidingView>
  );
}
