import "./src/i18n";
import React, { useEffect, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppLockProvider, useAppLock } from "./src/context/AppLock";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import { getStoredToken, clearStoredToken } from "./src/store/token";
import { LockScreen } from "./src/screens/LockScreen";
import { WelcomeScreen } from "./src/screens/WelcomeScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { RegisterScreen } from "./src/screens/RegisterScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { QuickAddScreen } from "./src/screens/QuickAddScreen";
import { TimelineScreen } from "./src/screens/TimelineScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { ToastProvider } from "./src/components/Toast";
import { TimerProvider } from "./src/components/TimerContext";
import { TimerBar } from "./src/components/TimerBar";

const Stack = createNativeStackNavigator();
const queryClient = new QueryClient();

function AuthFlow({ onDone }: { onDone: () => void }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome">
        {(props) => (
          <WelcomeScreen
            {...props}
            onLogin={() => props.navigation.navigate("Login")}
            onRegister={() => props.navigation.navigate("Register")}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Login">
        {(props) => (
          <LoginScreen
            onDone={onDone}
            onGoRegister={() => props.navigation.navigate("Register")}
            onBack={() => props.navigation.navigate("Welcome")}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Register">
        {(props) => (
          <RegisterScreen
            onDone={onDone}
            onBack={() => props.navigation.navigate("Welcome")}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

function MainFlow({ onLogout }: { onLogout: () => void }) {
  const { locked, checkLock } = useAppLock();
  const { themeColors, isDark } = useTheme();

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (state === "active") checkLock();
    });
    return () => sub.remove();
  }, [checkLock]);

  if (locked) {
    return <LockScreen />;
  }

  return (
    <NavigationContainer>
      <TimerBar />
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: themeColors.background },
          headerTintColor: themeColors.text,
          headerTitleStyle: { fontWeight: "600", color: themeColors.text },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: "BabyLog" }} />
        <Stack.Screen name="QuickAdd" component={QuickAddScreen} />
        <Stack.Screen name="Timeline" component={TimelineScreen} />
        <Stack.Screen name="Settings">
          {(props) => <SettingsScreen {...props} onLogout={onLogout} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function Root() {
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  useEffect(() => {
    let done = false;
    const timeout = setTimeout(() => {
      if (!done) { done = true; setHasToken(false); }
    }, 5000);
    getStoredToken()
      .then((t) => { if (!done) { done = true; clearTimeout(timeout); setHasToken(!!t); } })
      .catch(() => { if (!done) { done = true; clearTimeout(timeout); setHasToken(false); } });
  }, []);

  const handleLogout = () => {
    clearStoredToken();
    queryClient.clear();
    setHasToken(false);
  };

  if (hasToken === null) return null;

  if (!hasToken) {
    return (
      <NavigationContainer>
        <AuthFlow onDone={() => setHasToken(true)} />
      </NavigationContainer>
    );
  }

  return (
    <AppLockProvider>
      <MainFlow onLogout={handleLogout} />
    </AppLockProvider>
  );
}

function AppContent() {
  const { isDark } = useTheme();
  return (
    <>
      <Root />
      <StatusBar style={isDark ? "light" : "dark"} />
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TimerProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </TimerProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
