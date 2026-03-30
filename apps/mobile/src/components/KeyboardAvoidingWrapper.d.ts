import type React from "react";
import type { ViewStyle } from "react-native";

export interface KeyboardAvoidingWrapperProps {
  style?: ViewStyle;
  children: React.ReactNode;
}

export declare const KeyboardAvoidingWrapper: React.FC<KeyboardAvoidingWrapperProps>;
