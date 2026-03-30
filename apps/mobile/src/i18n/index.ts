import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import zh from "./locales/zh.json";
import en from "./locales/en.json";

const LANGUAGE_KEY = "babylog_language";

export type LanguagePref = "zh" | "en" | "system";

function getDeviceLanguage(): string {
  const locale = Localization.getLocales()?.[0]?.languageCode ?? "zh";
  return locale.startsWith("zh") ? "zh" : "en";
}

async function getInitialLanguage(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (stored === "zh" || stored === "en") return stored;
    return getDeviceLanguage();
  } catch {
    return getDeviceLanguage();
  }
}

export async function setLanguagePref(pref: LanguagePref) {
  if (pref === "system") {
    await AsyncStorage.removeItem(LANGUAGE_KEY);
    i18n.changeLanguage(getDeviceLanguage());
  } else {
    await AsyncStorage.setItem(LANGUAGE_KEY, pref);
    i18n.changeLanguage(pref);
  }
}

export async function getLanguagePref(): Promise<LanguagePref> {
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (stored === "zh" || stored === "en") return stored;
    return "system";
  } catch {
    return "system";
  }
}

const initI18n = async () => {
  const lng = await getInitialLanguage();
  await i18n.use(initReactI18next).init({
    resources: { zh: { translation: zh }, en: { translation: en } },
    lng,
    fallbackLng: "zh",
    interpolation: { escapeValue: false },
  });
};

initI18n();

export default i18n;
