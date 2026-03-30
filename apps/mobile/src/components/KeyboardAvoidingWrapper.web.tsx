import React from "react";
import { View } from "react-native";
import type { KeyboardAvoidingWrapperProps } from "./KeyboardAvoidingWrapper";

export function KeyboardAvoidingWrapper({ style, children }: KeyboardAvoidingWrapperProps) {
  return <View style={style}>{children}</View>;
}
