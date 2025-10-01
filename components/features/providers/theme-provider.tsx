"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ThemePreference } from "@/lib/database.types";

type ThemeContextValue = {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getSystemTheme(): ThemePreference {
  if (typeof window === "undefined") {
    return "system";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>("system");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("strong-web-theme") as ThemePreference | null;
    if (stored) {
      setThemeState(stored);
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const resolvedTheme = theme === "system" ? getSystemTheme() : theme;
    root.dataset.theme = resolvedTheme;
    if (theme !== "system") {
      window.localStorage.setItem("strong-web-theme", theme);
    } else {
      window.localStorage.removeItem("strong-web-theme");
    }
  }, [theme]);

  const setTheme = useCallback((value: ThemePreference) => {
    setThemeState(value);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
