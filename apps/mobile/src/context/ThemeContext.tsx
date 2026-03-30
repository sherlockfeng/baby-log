import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { darkColors, lightColors, type ThemeColors } from "../theme";

export type ThemePref = "light" | "dark" | "system";

const THEME_KEY = "babylog_theme";

interface ThemeContextValue {
  themePref: ThemePref;
  setThemePref: (pref: ThemePref) => Promise<void>;
  themeColors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  themePref: "system",
  setThemePref: async () => {},
  themeColors: darkColors,
  isDark: true,
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themePref, setThemePrefState] = useState<ThemePref>("system");

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((v) => {
      if (v === "light" || v === "dark" || v === "system") setThemePrefState(v);
    });
  }, []);

  const setThemePref = useCallback(async (pref: ThemePref) => {
    setThemePrefState(pref);
    await AsyncStorage.setItem(THEME_KEY, pref);
  }, []);

  const isDark = themePref === "system" ? systemScheme !== "light" : themePref === "dark";
  const themeColors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ themePref, setThemePref, themeColors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}
