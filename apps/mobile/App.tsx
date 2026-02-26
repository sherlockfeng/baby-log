import React, { useEffect, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppLockProvider, useAppLock } from "./src/context/AppLock";
import { getStoredToken, clearStoredToken } from "./src/store/token";
import { LockScreen } from "./src/screens/LockScreen";
import { SetupScreen } from "./src/screens/SetupScreen";
import { CreateFamilyScreen } from "./src/screens/CreateFamilyScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { QuickAddScreen } from "./src/screens/QuickAddScreen";
import { TimelineScreen } from "./src/screens/TimelineScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";

const Stack = createNativeStackNavigator();
const queryClient = new QueryClient();

function SetupFlow({ onDone }: { onDone: () => void }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Setup">
        {(props) => <SetupScreen {...props} onDone={onDone} navigation={props.navigation} />}
      </Stack.Screen>
      <Stack.Screen name="CreateFamily">
        {(props) => <CreateFamilyScreen {...props} onDone={onDone} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

function MainFlow({ onLogout }: { onLogout: () => void }) {
  const { locked, checkLock } = useAppLock();

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
      <Stack.Navigator screenOptions={{ headerShown: true }}>
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
    getStoredToken().then((t) => setHasToken(!!t));
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
        <SetupFlow onDone={() => setHasToken(true)} />
      </NavigationContainer>
    );
  }

  return (
    <AppLockProvider>
      <MainFlow onLogout={handleLogout} />
    </AppLockProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Root />
      <StatusBar style="auto" />
    </QueryClientProvider>
  );
}
