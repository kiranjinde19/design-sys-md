"use client";

import { useCallback, useSyncExternalStore } from "react";

const KEY = "design-sys-md:tool-theme";
const listeners = new Set<() => void>();

function read(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "dark";
  } catch {
    return false;
  }
}

/** The tool's own light or dark mode. It never touches the user's design system, and is remembered per browser. */
export function useToolTheme(): { dark: boolean; toggle: () => void } {
  const dark = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    read,
    () => false,
  );
  const toggle = useCallback(() => {
    try {
      window.localStorage.setItem(KEY, read() ? "light" : "dark");
    } catch {
      // Storage blocked: the switch still works until the page reloads.
    }
    listeners.forEach((listener) => listener());
  }, []);
  return { dark, toggle };
}
