import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

export type TimerType = "feed" | "sleep";

interface TimerState {
  active: boolean;
  type: TimerType | null;
  startTime: number; // Date.now()
  elapsed: number;   // seconds
}

interface TimerContextValue {
  timer: TimerState;
  startTimer: (type: TimerType) => void;
  stopTimer: () => { type: TimerType; durationMin: number; startIso: string; endIso: string } | null;
}

const TimerContext = createContext<TimerContextValue>({
  timer: { active: false, type: null, startTime: 0, elapsed: 0 },
  startTimer: () => {},
  stopTimer: () => null,
});

export const useTimer = () => useContext(TimerContext);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [timer, setTimer] = useState<TimerState>({ active: false, type: null, startTime: 0, elapsed: 0 });
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (timer.active) {
      intervalRef.current = setInterval(() => {
        setTimer((prev) => ({ ...prev, elapsed: Math.floor((Date.now() - prev.startTime) / 1000) }));
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timer.active]);

  const startTimer = useCallback((type: TimerType) => {
    setTimer({ active: true, type, startTime: Date.now(), elapsed: 0 });
  }, []);

  const stopTimer = useCallback(() => {
    if (!timer.active || !timer.type) return null;
    const endTime = Date.now();
    const durationMin = Math.round((endTime - timer.startTime) / 60000);
    const result = {
      type: timer.type,
      durationMin: Math.max(durationMin, 1),
      startIso: new Date(timer.startTime).toISOString(),
      endIso: new Date(endTime).toISOString(),
    };
    setTimer({ active: false, type: null, startTime: 0, elapsed: 0 });
    return result;
  }, [timer]);

  return (
    <TimerContext.Provider value={{ timer, startTimer, stopTimer }}>
      {children}
    </TimerContext.Provider>
  );
}
