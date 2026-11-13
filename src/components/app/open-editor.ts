"use client";

import { useCallback, useSyncExternalStore } from "react";
import { SYSTEMS, type SystemId } from "@/lib/design-system";

/** Which editor is open on the board. Kept for the browser session, so Back from the Export screen returns to it. */
const KEY = "design-sys-md:open-editor";
const listeners = new Set<() => void>();

function read(): SystemId | null {
  try {
    const saved = window.sessionStorage.getItem(KEY);
    return SYSTEMS.find((system) => system.id === saved)?.id ?? null;
  } catch {
    return null;
  }
}

export function useOpenEditor(): [SystemId | null, (id: SystemId | null) => void] {
  const open = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    read,
    () => null,
  );
  const set = useCallback((id: SystemId | null) => {
    try {
      if (id) window.sessionStorage.setItem(KEY, id);
      else window.sessionStorage.removeItem(KEY);
    } catch {
      // Storage blocked: the editor still opens for this page view.
    }
    listeners.forEach((listener) => listener());
  }, []);
  return [open, set];
}
