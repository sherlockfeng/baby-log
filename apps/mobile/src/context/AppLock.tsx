import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as LocalAuthentication from "expo-local-authentication";
import { getFaceIdEnabled, isWithinGracePeriod, setLastUnlockTime } from "../store/settings";

type AppLockContextValue = {
  locked: boolean;
  unlock: () => Promise<boolean>;
  checkLock: () => Promise<void>;
};

const AppLockContext = createContext<AppLockContextValue | null>(null);

export function AppLockProvider({ children }: { children: React.ReactNode }) {
  const [locked, setLocked] = useState(true);
  const [ready, setReady] = useState(false);

  const unlock = useCallback(async (): Promise<boolean> => {
    const enabled = await getFaceIdEnabled();
    if (!enabled) {
      setLocked(false);
      await setLastUnlockTime();
      return true;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Unlock BabyLog",
    });
    if (result.success) {
      setLocked(false);
      await setLastUnlockTime();
      return true;
    }
    return false;
  }, []);

  const checkLock = useCallback(async () => {
    const enabled = await getFaceIdEnabled();
    if (!enabled) {
      setLocked(false);
      setReady(true);
      return;
    }
    const withinGrace = await isWithinGracePeriod();
    if (withinGrace) {
      setLocked(false);
      await setLastUnlockTime();
    } else {
      setLocked(true);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    checkLock();
  }, [checkLock]);

  const value: AppLockContextValue = { locked, unlock, checkLock };

  if (!ready) {
    return null;
  }

  return (
    <AppLockContext.Provider value={value}>
      {children}
    </AppLockContext.Provider>
  );
}

export function useAppLock() {
  const ctx = useContext(AppLockContext);
  if (!ctx) throw new Error("useAppLock must be used within AppLockProvider");
  return ctx;
}
