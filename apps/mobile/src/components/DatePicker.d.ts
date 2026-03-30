import type React from "react";

export interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  maximumDate?: Date;
  minimumDate?: Date;
  placeholder?: string;
  testID?: string;
  mode?: "date" | "datetime";
}

export declare const DatePicker: React.FC<DatePickerProps>;
