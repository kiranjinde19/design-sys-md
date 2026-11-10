"use client";

/**
 * Shares the design system with every component through React context.
 * Components call useDesignSystem() and get the settings, the generated tokens,
 * and functions to change them. Every change is autosaved (see storage.ts).
 */

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { generateTokens } from "./generate";
import type { SettingsPatch } from "./normalize";
import { PRESETS, type PresetId } from "./presets";
import {
  applyPreset,
  getServerSnapshot,
  getSnapshot,
  resetToPreset,
  subscribe,
  updateSettings,
} from "./storage";
import type { DesignSystemSettings, DesignSystemTokens } from "./types";

export interface DesignSystemContextValue {
  /** The preset this work started from. */
  presetId: PresetId;
  /** True once the saved work has been loaded from the browser. */
  ready: boolean;
  /** True if the settings differ from the preset they started from. */
  isModified: boolean;
  settings: DesignSystemSettings;
  tokens: DesignSystemTokens;
  /** Change any setting. Invalid values are corrected automatically. */
  update: (patch: SettingsPatch) => void;
  /** Replace everything with a preset. */
  applyPreset: (presetId: PresetId) => void;
  /** Throw away edits and return to the current preset. */
  reset: () => void;
}

const DesignSystemContext = createContext<DesignSystemContextValue | null>(null);

const subscribeNever = () => () => {};
const readyOnClient = () => true;
const readyOnServer = () => false;

export function DesignSystemProvider({ children }: { children: ReactNode }) {
  const stored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ready = useSyncExternalStore(subscribeNever, readyOnClient, readyOnServer);

  const value = useMemo<DesignSystemContextValue>(() => {
    const { presetId, settings } = stored;
    return {
      presetId,
      ready,
      isModified: JSON.stringify(settings) !== JSON.stringify(PRESETS[presetId].settings),
      settings,
      tokens: generateTokens(settings),
      update: updateSettings,
      applyPreset,
      reset: resetToPreset,
    };
  }, [stored, ready]);

  return <DesignSystemContext.Provider value={value}>{children}</DesignSystemContext.Provider>;
}

export function useDesignSystem(): DesignSystemContextValue {
  const context = useContext(DesignSystemContext);
  if (!context) throw new Error("useDesignSystem must be used inside <DesignSystemProvider>.");
  return context;
}
