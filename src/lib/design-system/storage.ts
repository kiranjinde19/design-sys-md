/**
 * Autosave. A tiny store that keeps the current settings in memory and mirrors
 * them to localStorage, so a refresh never loses work. React reads it through
 * useSyncExternalStore (see provider.tsx), which avoids a flash of wrong content.
 */

import { dropLegacyAutoSecondary } from "./migrations";
import { applyPatch, normalizeSettings, type SettingsPatch } from "./normalize";
import { DEFAULT_PRESET_ID, PRESETS, isPresetId, type PresetId } from "./presets";
import { SETTINGS_SCHEMA_VERSION, type DesignSystemSettings } from "./types";

const STORAGE_KEY = "design-sys-md:design-system";

export interface StoredState {
  /** The preset this work started from. */
  presetId: PresetId;
  settings: DesignSystemSettings;
}

const INITIAL_STATE: StoredState = {
  presetId: DEFAULT_PRESET_ID,
  settings: PRESETS[DEFAULT_PRESET_ID].settings,
};

let state: StoredState | null = null;
const listeners = new Set<() => void>();

function readFromStorage(): StoredState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    const parsed: unknown = JSON.parse(raw);
    const record = typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : {};
    const presetId = isPresetId(record.presetId) ? record.presetId : DEFAULT_PRESET_ID;
    return {
      presetId,
      settings: dropLegacyAutoSecondary(normalizeSettings(record.settings, PRESETS[presetId].settings)),
    };
  } catch {
    // Storage blocked or the saved data is broken: start fresh instead of crashing.
    return INITIAL_STATE;
  }
}

function commit(next: StoredState) {
  state = next;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: SETTINGS_SCHEMA_VERSION, ...next }),
    );
  } catch {
    // Private mode or full storage: the app still works, it just will not autosave.
  }
  listeners.forEach((listener) => listener());
}

function onStorageEvent(event: StorageEvent) {
  // Another tab changed the saved work: pick it up.
  if (event.key !== STORAGE_KEY) return;
  state = readFromStorage();
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener("storage", onStorageEvent);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorageEvent);
  };
}

/** What the browser sees. Reads localStorage once, then serves from memory. */
export function getSnapshot(): StoredState {
  if (state === null) state = readFromStorage();
  return state;
}

/** What the server sees: always the default preset, because the server has no localStorage. */
export function getServerSnapshot(): StoredState {
  return INITIAL_STATE;
}

export function updateSettings(patch: SettingsPatch) {
  const current = getSnapshot();
  commit({ ...current, settings: applyPatch(current.settings, patch) });
}

/** Switching preset changes the look, but keeps the product name, description and stack. */
export function applyPreset(presetId: PresetId) {
  const { settings } = getSnapshot();
  commit({ presetId, settings: { ...PRESETS[presetId].settings, project: settings.project } });
}

export function resetToPreset() {
  const { presetId, settings } = getSnapshot();
  commit({ presetId, settings: { ...PRESETS[presetId].settings, project: settings.project } });
}

/** Replaces everything, for importing a previously exported file. The settings are validated first. */
export function importSettings(raw: unknown) {
  const { presetId } = getSnapshot();
  commit({ presetId, settings: normalizeSettings(raw, PRESETS[presetId].settings) });
}
