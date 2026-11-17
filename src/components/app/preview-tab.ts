"use client";

import { useSyncExternalStore } from "react";
import type { SystemId } from "@/lib/design-system";

/** The live preview's tabs. The selected one is shared between the preview and the editors, and remembered between visits. */
export const PREVIEW_TABS = ["Pricing", "Buttons and states", "Forms", "Tables", "Dashboard", "Charts"] as const;
export type PreviewTab = (typeof PREVIEW_TABS)[number];

const TAB_KEY = "design-sys-md:preview-tab";
const listeners = new Set<() => void>();
let current: PreviewTab | null = null;

function read(): PreviewTab {
  if (current) return current;
  try {
    const saved = window.localStorage.getItem(TAB_KEY);
    current = PREVIEW_TABS.find((name) => name === saved) ?? "Pricing";
  } catch {
    current = "Pricing";
  }
  return current;
}

export function setPreviewTab(next: PreviewTab) {
  current = next;
  try {
    window.localStorage.setItem(TAB_KEY, next);
  } catch {
    // Storage blocked: the tab still switches.
  }
  listeners.forEach((listener) => listener());
}

export function usePreviewTab(): PreviewTab {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    read,
    () => "Pricing",
  );
}

/**
 * The tab that shows what an editor step changes, so the result is visible right away. The person can open any other tab
 * afterwards. Wide pages (Pricing, Dashboard, Charts) are drawn at 65%; Forms, Buttons and Tables are full size.
 */
export const TAB_FOR_SYSTEM: Record<SystemId, PreviewTab> = {
  colors: "Pricing",
  typography: "Forms",
  radius: "Buttons and states",
  spacing: "Tables",
  borders: "Forms",
  shadows: "Pricing",
  buttons: "Buttons and states",
  signature: "Pricing",
  voice: "Pricing",
};

/** Signature details: the focus ring shows on Buttons and states; every other category shows on the Pricing cards. */
export const TAB_FOR_SIGNATURE: Record<string, PreviewTab> = { focusRing: "Buttons and states" };
